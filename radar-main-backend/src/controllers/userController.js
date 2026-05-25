const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { calculatePortfolioRisk } = require('../services/portfolioRiskService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const sendEmail = require('../services/mailService');
const logger = require('../config/logger');
const { getDbStatus } = require('../config/db');
const {
    getWelcomeTemplate,
    getVerifyTemplate,
    getResetTemplate,
    getLoginAlertTemplate,
    getSupportConfirmTemplate,
    getPasswordChangedTemplate
} = require('../utils/emailTemplates');


const generateToken = (id, tokenVersion = 0) => {
    console.log(`[auth-debug] Generating JWT token for user ID: ${id}, tokenVersion: ${tokenVersion}`);
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();
const MAX_PROFILE_PICTURE_LENGTH = 4 * 1024 * 1024;

const registerUser = asyncHandler(async (req, res) => {
    if (!getDbStatus()) {
        return res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
    }

    const { username, password, email, identifier } = req.body;
    console.log(`[auth-debug] Register attempt: username=${username}, email=${email || identifier}`);

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.' });
    }

    try {
        const normalizedUsername = String(username || '').trim().toLowerCase();
        const normalizedEmail = normalizeIdentifier(email || identifier || '');
        if (!normalizedEmail) {
            return res.status(400).json({ error: 'Email address is required' });
        }

        let user;
        const userExists = await User.findOne({
            $or: [
                { username: normalizedUsername },
                { email: normalizedEmail }
            ],
        });

        if (userExists) {
            if (userExists.isVerified === false) {
                console.log(`[auth-debug] Unverified user already exists. Overwriting/updating password and credentials...`);
                userExists.password = password;
                userExists.username = normalizedUsername;
                userExists.email = normalizedEmail;
                user = userExists;
            } else {
                return res.status(400).json({ error: 'Username or Email already registered' });
            }
        } else {
            user = new User({
                username: normalizedUsername,
                password,
                email: normalizedEmail,
                isVerified: false
            });
        }

        const hasSmtp = (process.env.SMTP_EMAIL && !process.env.SMTP_EMAIL.includes('YOUR_') && !process.env.SMTP_EMAIL.includes('your_')) ||
                        (process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_') && !process.env.EMAIL_USER.includes('YOUR_'));
        
        if (!hasSmtp) {
            console.log(`[auth-debug] Auto-verifying new registration (reason: SMTP credentials not configured).`);
            user.isVerified = true;
        } else {
            console.log(`[auth-debug] SMTP credentials configured. Initializing verification flow.`);
            user.isVerified = false;
        }

        let verificationToken;
        if (!user.isVerified) {
            verificationToken = user.getVerificationToken();
        }

        await user.save();

        if (user.isVerified) {
            return res.status(201).json({
                success: true,
                message: 'Registration successful! You can now log in.',
                verified: true
            });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

        logger.info(`[registerUser] User created. Verification URL: ${verifyUrl}`);

        const emailHtml = getVerifyTemplate(user.username, verifyUrl);
        await sendEmail({
            email: user.email,
            subject: 'Verify your RADAR account',
            message: `Welcome to RADAR! Please verify your account using this link: ${verifyUrl}`,
            html: emailHtml
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! We have sent a verification email to your address. Please verify your email before logging in.'
        });
    } catch (error) {
        logger.error('Error during user registration:', error);
        res.status(400).json({ error: 'Invalid user data', details: error.message });
    }
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

const googleAuth = asyncHandler(async (req, res) => {
    if (!getDbStatus()) {
        return res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
    }

    const { token, isSignup } = req.body;

    try {
        let name, email, picture;

        // An ID token (JWT) has 3 parts separated by dots. An access token usually does not.
        if (token.split('.').length === 3) {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
            picture = payload.picture;
        } else {
            // It's an access token from useGoogleLogin
            const axios = require('axios');
            const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            name = response.data.name;
            email = response.data.email;
            picture = response.data.picture;
        }

        let user = await User.findOne({ email });

        if (user) {
            // Retroactively stamp authProvider and picture for users created before this field existed
            let saveNeeded = false;
            if (!user.authProvider || user.authProvider === 'email') {
                user.authProvider = 'google';
                saveNeeded = true;
            }
            if (!user.profilePicture && picture) {
                user.profilePicture = picture;
                saveNeeded = true;
            }
            if (!user.isVerified) {
                user.isVerified = true;
                saveNeeded = true;
            }
            if (saveNeeded) {
                await user.save();
            }
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                preferredMode: user.preferredMode,
                token: generateToken(user._id, user.tokenVersion),
                picture: picture,
                isNewUser: false
            });
        } else {
            console.log(`[auth-debug] Google user not found. Automatically creating new user for email: ${email}`);
            
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await User.create({
                username: name,
                email: email,
                password: randomPassword,
                authProvider: 'google',
                profilePicture: picture || '',
                isVerified: true
            });

            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                preferredMode: user.preferredMode,
                token: generateToken(user._id, user.tokenVersion),
                picture: picture,
                isNewUser: true
            });
        }
    } catch (error) {
        logger.error('Error during Google login:', error);
        res.status(400).json({ error: 'Google Login Failed', details: error.message });
    }
});


const loginUser = asyncHandler(async (req, res) => {
    if (!getDbStatus()) {
        console.warn(`[auth-debug] Login failed because DB status is disconnected.`);
        return res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
    }

    const { username, identifier, password } = req.body;
    const loginId = String(username || identifier || '').trim();
    const normalized = normalizeIdentifier(loginId);

    console.log(`[auth-debug] Login attempt received for identifier: "${loginId}"`);

    try {
        if (!loginId || !password) {
            console.warn(`[auth-debug] Login rejected: username/email or password field is missing.`);
            return res.status(400).json({ error: 'Username/email and password are required' });
        }

        const user = await User.findOne({
            $or: [
                { username: normalized },
                { email: normalized },
            ],
        });

        if (!user) {
            console.warn(`[auth-debug] Login failed: No user found matching "${loginId}"`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            if (!user.isVerified) {
                console.warn(`[auth-debug] Login failed: User "${user.username}" is not verified.`);
                return res.status(401).json({ 
                    error: 'Please verify your email address before logging in.',
                    needsVerification: true,
                    email: user.email
                });
            }

            console.log(`[auth-debug] Login successful for user: "${user.username}"`);

            // Send login security alert email (non-blocking)
            if (user.email) {
                const alertHtml = getLoginAlertTemplate(user.username, {
                    ip: req.ip || 'Unknown',
                    device: req.headers['user-agent'] || 'Unknown Device',
                    time: new Date().toLocaleString()
                });
                sendEmail({
                    email: user.email,
                    subject: 'Security Alert: New Login Detected',
                    message: `Hello ${user.username}, a new login was detected on your RADAR account. IP: ${req.ip || 'Unknown'}.`,
                    html: alertHtml
                }).catch(e => logger.warn(`Failed to send login alert: ${e.message}`));
            }

            res.json({
                _id: user._id,
                username: user.username,
                email: user.email || null,
                preferredMode: user.preferredMode,
                token: generateToken(user._id, user.tokenVersion)
            });
        } else {
            console.warn(`[auth-debug] Login failed: Incorrect password for user "${user.username}"`);
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        logger.error('Error during user login:', error);
        console.error(`[auth-debug] Login exception caught: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    const u = req.user;
    res.json({
        _id:          u._id,
        username:     u.username,
        email:        u.email || null,
        address:      u.address || '',
        phone:        u.phone || '',
        profilePicture: u.profilePicture || '',
        preferredMode: u.preferredMode,
        createdAt:    u.createdAt,
        joinedDate:   u.createdAt
            ? `Joined ${new Date(u.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' })}`
            : null,
        watchlist:    u.watchlist,
        settings:     u.settings || {},
        investorDNA:  u.investorDNA || null,
        notificationPreferences: u.notificationPreferences || {
            priceAlerts: true,
            earningsUpdates: true,
            importantNews: true
        },
        authProvider: u.authProvider || 'email'
    });
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { username, email, address, phone, profilePicture } = req.body;
    logger.info(`[updateUserProfile] Received: username=${username}, email=${email}, userId=${req.user?._id}`);

    const user = await User.findById(req.user._id);
    if (!user) {
        logger.error('[updateUserProfile] User not found in DB for id:', req.user._id);
        return res.status(404).json({ error: 'User not found' });
    }

    let targetUser = user;

    if (username && username !== user.username) {
        const taken = await User.findOne({ username, _id: { $ne: user._id } });
        if (taken) return res.status(400).json({ error: 'Username already taken' });
        user.username = username.trim();
    }
    if (email && email !== user.email) {
        const normalizedEmail = email.trim().toLowerCase();
        const taken = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (taken) return res.status(400).json({ error: 'Email already taken' });
        user.email = normalizedEmail;
    }
    if (address !== undefined) {
        user.address = String(address || '').trim();
    }
    if (phone !== undefined) {
        user.phone = String(phone || '').trim();
    }
    if (profilePicture !== undefined) {
        const nextPicture = String(profilePicture || '').trim();
        if (nextPicture.length > MAX_PROFILE_PICTURE_LENGTH) {
            return res.status(400).json({ error: 'Profile picture is too large. Please choose a smaller image.' });
        }
        user.profilePicture = nextPicture;
    }

    try {
        await user.save();
        logger.info('[updateUserProfile] Saved successfully for user:', user._id);
    } catch (saveErr) {
        logger.error('[updateUserProfile] Save FAILED:', saveErr.message, saveErr.errors);
        return res.status(500).json({ error: 'Failed to save profile', details: saveErr.message });
    }

    res.json({
        success: true,
        data: {
            _id: user._id,
            username: user.username,
            email: user.email,
            address: user.address || '',
            phone: user.phone || '',
            profilePicture: user.profilePicture || '',
            preferredMode: user.preferredMode,
            createdAt: user.createdAt,
            authProvider: user.authProvider || 'email',
        }
    });
});

const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (String(newPassword).length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
});

// For Google users who never set a password — no current password required
const setPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = newPassword;
    user.authProvider = 'email'; // They now have a real password
    await user.save();

    res.json({ success: true, message: 'Password set successfully' });
});

const saveInvestorDNA = asyncHandler(async (req, res) => {
    const {
        dominant, personaName, personaDescription,
        investorPercent, traderPercent, traits,
        hybridLine, confidence, metrics
    } = req.body;

    const user = await User.findById(req.user._id);
    user.investorDNA = {
        dominant,
        personaName,
        personaDescription,
        investorPercent,
        traderPercent,
        traits: traits || [],
        hybridLine,
        confidence,
        metrics: metrics || {},
        completedAt: new Date()
    };
    // Also update preferredMode to match DNA result
    if (dominant === 'TRADER' || dominant === 'INVESTOR') {
        user.preferredMode = dominant;
    }

    await user.save();
    res.json({ success: true, data: user.investorDNA });
});

const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const { priceAlerts, earningsUpdates, importantNews } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.notificationPreferences) {
        user.notificationPreferences = {};
    }
    if (priceAlerts     !== undefined) user.notificationPreferences.priceAlerts     = Boolean(priceAlerts);
    if (earningsUpdates !== undefined) user.notificationPreferences.earningsUpdates = Boolean(earningsUpdates);
    if (importantNews   !== undefined) user.notificationPreferences.importantNews   = Boolean(importantNews);

    // Mark the nested path as modified (Mongoose quirk for nested objects)
    user.markModified('notificationPreferences');
    await user.save();

    res.json({ success: true, data: user.notificationPreferences });
});

const getMode = asyncHandler(async (req, res) => {
    res.json({ preferredMode: req.user.preferredMode });
});

const updateMode = asyncHandler(async (req, res) => {
    const { mode } = req.body;
    
    const user = await User.findById(req.user._id);

    user.preferredMode = mode;
    await user.save();
    res.json({ message: "Mode updated", preferredMode: user.preferredMode });
});

// Investor Dashboard APIs Implementation

const getUserPortfolio = asyncHandler(async (req, res) => {
    const riskData = await calculatePortfolioRisk(req.user._id);
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    
    // Calculate total investment (sum of qty * avgBuyPrice)
    const totalInvestment = (portfolio?.holdings || []).reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0);
    const currentValue = riskData.totalValue - (portfolio?.cashBalance || 100000); // Only holdings value
    const pnlValue = currentValue - totalInvestment;
    const pnlPercent = totalInvestment > 0 ? (pnlValue / totalInvestment) * 100 : 0;
    const dayChange = (currentValue * 0.012) * (Math.random() > 0.5 ? 1 : -1); // Mock day change

    res.json({
        totalInvestment: Number(totalInvestment.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        overallPnL: Number(pnlValue.toFixed(2)),
        overallPnLPercent: Number(pnlPercent.toFixed(2)),
        dayChange: Number(dayChange.toFixed(2)),
        dayChangePercent: Number(((dayChange / currentValue) * 100).toFixed(2)),
        riskLevel: riskData.riskLevel,
        sectorWeights: riskData.sectorWeights,
        chartData: [2100, 2150, 2120, 2180, 2200, 2190, 2250] // Mock growth chart
    });
});

const getUserPerformance = asyncHandler(async (req, res) => {
    // Mock performance comparison with Nifty 50
    res.json({
        portfolioReturn: 12.8,
        indexReturn: 8.6,
        alpha: 4.2,
        timeframe: '1Y',
        history: [
            { date: '2024-01', portfolio: 100, index: 100 },
            { date: '2024-02', portfolio: 105, index: 103 },
            { date: '2024-03', portfolio: 102, index: 101 },
            { date: '2024-04', portfolio: 110, index: 106 },
            { date: '2024-05', portfolio: 115, index: 108 }
        ]
    });
});

const getUserHoldings = asyncHandler(async (req, res) => {
    const riskData = await calculatePortfolioRisk(req.user._id);
    const holdings = riskData.concentration.map(c => ({
        symbol: c.symbol,
        sector: c.sector,
        currentPrice: c.price,
        allocation: c.weightPct,
        value: c.value
    }));
    
    res.json(holdings);
});

const getUserInsights = asyncHandler(async (req, res) => {
    const riskData = await calculatePortfolioRisk(req.user._id);
    const insights = [];
    
    if (riskData.riskLevel === 'high') {
        insights.push({ type: 'warning', text: "Your portfolio risk is high. Consider diversifying into defensive sectors." });
    }
    
    if (riskData.concentration.length > 0 && riskData.concentration[0].weightPct > 30) {
        insights.push({ type: 'info', text: `High exposure to ${riskData.concentration[0].symbol} (${riskData.concentration[0].weightPct.toFixed(1)}%). Consider rebalancing.` });
    }

    if (riskData.sectorWeights.length > 0 && riskData.sectorWeights[0].weightPct > 40) {
        insights.push({ type: 'info', text: `${riskData.sectorWeights[0].name} sector allocation (${riskData.sectorWeights[0].weightPct.toFixed(1)}%) is higher than typical benchmarks.` });
    }

    // Dynamic positive insight
    const user = req.user;
    if (user.investorDNA?.personaName) {
        insights.push({ type: 'success', text: `Your ${user.investorDNA.personaName} persona is currently aligned with the market mood.` });
    } else {
        insights.push({ type: 'success', text: "Portfolio strategy is currently aligned with market mood." });
    }

    res.json(insights);
});

const getUserNews = asyncHandler(async (req, res) => {
    // Mock news relevant to portfolio
    res.json([
        { title: "Reliance Industries shares hit record high as profits soar", source: "Mint", time: "2h ago", sentiment: "positive" },
        { title: "Infosys Q4 results: What to expect from IT major?", source: "MoneyControl", time: "5h ago", sentiment: "neutral" },
        { title: "TATA Motors wins massive EV order in Europe", source: "Bloomberg", time: "1d ago", sentiment: "positive" }
    ]);
});

const getUserEvents = asyncHandler(async (req, res) => {
    // Mock upcoming events for held stocks
    res.json([
        { symbol: "RELIANCE", event: "Q4 Earnings Call", date: "May 25, 2024", type: "earnings" },
        { symbol: "INFY", event: "Dividend Record Date", date: "June 02, 2024", type: "dividend" },
        { symbol: "TATAMOTORS", event: "Annual General Meeting", date: "June 15, 2024", type: "agm" }
    ]);
});

const forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: normalizeIdentifier(req.body.email) });

    if (!user) {
        return res.status(404).json({ error: 'There is no user with that email address.' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    logger.info(`[forgotPassword] Created reset URL: ${resetUrl}`);

    const message = `You are receiving this email because you (or someone else) has requested a password reset. Please reset your password at: ${resetUrl}`;
    const emailHtml = getResetTemplate(user.username, resetUrl);

    try {
        await sendEmail({
            email: user.email,
            subject: 'Reset your RADAR Password',
            message,
            html: emailHtml
        });

        res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
    } catch (err) {
        logger.error('Failed to send password reset email:', err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({ error: 'Email could not be sent. Please check SMTP settings.' });
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    console.log(`[auth-debug] Password reset attempt with token: ${req.params.resetToken?.substring(0, 10)}...`);

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.' });
    }

    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        console.warn(`[auth-debug] Password reset failed: invalid or expired token.`);
        return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log(`[auth-debug] Password reset successful for user: ${user.username}`);

    // Send confirmation email (non-blocking)
    if (user.email) {
        const changedHtml = getPasswordChangedTemplate(user.username);
        sendEmail({
            email: user.email,
            subject: 'RADAR Password Changed Successfully',
            message: `Hello ${user.username}, this is a confirmation that your RADAR password has been changed.`,
            html: changedHtml
        }).catch(err => console.error('[SMTP-debug] Failed to send password change confirmation email:', err));
    }

    res.status(200).json({
        success: true,
        message: 'Password reset successful',
        _id: user._id,
        username: user.username,
        email: user.email || null,
        preferredMode: user.preferredMode,
        token: generateToken(user._id, user.tokenVersion)
    });
});

const logoutAll = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ success: true, message: 'Logged out from all devices' });
});

const verifyEmail = asyncHandler(async (req, res) => {
    const verificationToken = crypto
        .createHash('sha256')
        .update(req.params.verificationToken)
        .digest('hex');

    const user = await User.findOne({
        verificationToken,
        verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired email verification link.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    // Send welcome email (non-blocking)
    if (user.email) {
        const welcomeHtml = getWelcomeTemplate(user.username);
        sendEmail({
            email: user.email,
            subject: 'Welcome to RADAR!',
            message: `Welcome to RADAR, ${user.username}! Your email has been successfully verified.`,
            html: welcomeHtml
        }).catch(e => logger.warn(`Failed to send welcome email: ${e.message}`));
    }

    res.status(200).json({
        success: true,
        message: 'Your email has been verified successfully! You can now log in.',
        token: generateToken(user._id, user.tokenVersion)
    });
});

const resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email: normalizeIdentifier(email) });
    if (!user) {
        return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (user.isVerified) {
        return res.status(400).json({ error: 'This email is already verified.' });
    }

    const verificationToken = user.getVerificationToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    const emailHtml = getVerifyTemplate(user.username, verifyUrl);
    try {
        await sendEmail({
            email: user.email,
            subject: 'Verify your RADAR account',
            message: `Please verify your email address at: ${verifyUrl}`,
            html: emailHtml
        });
        res.status(200).json({ success: true, message: 'Verification email has been resent.' });
    } catch (err) {
        logger.error('Failed to resend verification email:', err);
        return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
    }
});

// Dev-only: Inspect a user by username/email and optionally test a password.
const devInspectUser = asyncHandler(async (req, res) => {
    // Only allow in non-production and from localhost for safety
    const allowedLocal = req.ip === '::1' || req.ip === '127.0.0.1' || (String(req.ip).startsWith('::ffff:127.0.0.1'));
    if (process.env.NODE_ENV === 'production' || !allowedLocal) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { login, testPassword } = req.query;
    if (!login) return res.status(400).json({ error: 'Provide ?login=USERNAME_OR_EMAIL' });

    const lookup = String(login || '').trim();
    const normalized = normalizeIdentifier(lookup);
    const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const usernameRegex = new RegExp(`^${escapeRegex(lookup)}$`, 'i');

    const user = await User.findOne({ $or: [{ username: usernameRegex }, { email: normalized }] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const response = {
        _id: user._id,
        username: user.username,
        email: user.email || null,
        authProvider: user.authProvider || 'email',
        createdAt: user.createdAt,
        hasPassword: Boolean(user.password)
    };

    if (testPassword) {
        try {
            const match = await user.matchPassword(testPassword);
            response.testPassword = { provided: true, match };
        } catch (err) {
            response.testPassword = { provided: true, error: err.message };
        }
    }

    res.json(response);
});

// Dev-only: list users (optional `q` to search username/email, `limit` to cap results)
const devListUsers = asyncHandler(async (req, res) => {
    const allowedLocal = req.ip === '::1' || req.ip === '127.0.0.1' || (String(req.ip).startsWith('::ffff:127.0.0.1'));
    if (process.env.NODE_ENV === 'production' || !allowedLocal) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { q, limit = 20 } = req.query;
    const query = {};
    if (q && String(q).trim()) {
        const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapeRegex(q.trim()), 'i');
        query.$or = [{ username: regex }, { email: regex }];
    }

    const users = await User.find(query)
        .limit(Number(limit) || 20)
        .select('_id username email authProvider createdAt')
        .lean();

    res.json({ count: users.length, users });
});

module.exports = { 
    registerUser, 
    loginUser, 
    googleAuth,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    devInspectUser,
    devListUsers,
    getUserProfile,
    updateUserProfile,
    updatePassword,
    setPassword,
    saveInvestorDNA,
    updateNotificationPreferences,
    getMode, 
    updateMode, 
    getUserPortfolio,
    getUserPerformance,
    getUserHoldings,
    getUserInsights,
    getUserNews,
    getUserEvents,
    logoutAll
};
