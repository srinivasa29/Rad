const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getOrCreateDevUser = async () => {
    let u = await User.findOne();
    if (!u) {
        const dummy = new User({
            username: 'devuser',
            email: 'dev@radar.com',
            password: 'password123',
            preferredMode: 'INVESTOR'
        });
        await dummy.save();
        u = dummy;
    }
    return u;
};

const authMiddleware = async (req, res, next) => {
    let token;

    // Check for development bypass
    const isBypassEnabled = process.env.DEV_BYPASS_AUTH === 'true';
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        try {
            token = authHeader.split(' ')[1];
            console.log(`[auth-debug] Verifying Bearer token starting with: ${token.substring(0, 15)}...`);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id);

            if (!req.user) {
                console.warn(`[auth-debug] User not found in database for ID: ${decoded.id}`);
                if (isBypassEnabled) {
                    req.user = await getOrCreateDevUser();
                    return next();
                }
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }

            if (req.user && req.user.isVerified === false && !isBypassEnabled) {
                console.warn(`[auth-debug] User ${req.user.email} is registered but not verified.`);
                return res.status(401).json({ error: 'Please verify your email address to continue.', needsVerification: true });
            }

            // If tokenVersion present in token, ensure it matches user's current tokenVersion
            if (typeof decoded.tokenVersion !== 'undefined') {
                const current = req.user.tokenVersion || 0;
                if (decoded.tokenVersion !== current) {
                    console.warn(`[auth-debug] Revoked token detected for user ${req.user.email}. Token version: ${decoded.tokenVersion}, Current version: ${current}`);
                    return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
                }
            }

            next();
        } catch (error) {
            console.error(`[auth-debug] JWT verification error: ${error.message}`);
            if (isBypassEnabled) {
                req.user = await getOrCreateDevUser();
                return next();
            }
            const reason = error?.name === 'JsonWebTokenError' ? 'invalid signature' : error?.message || 'unknown';
            console.warn(`[auth] Token rejected (${reason}) — client should re-login`);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } else {
        // Support legacy x-auth-token header
        const xToken = req.headers['x-auth-token'] || req.headers['X-Auth-Token'];
        if (xToken) {
            try {
                token = xToken;
                console.log(`[auth-debug] Verifying x-auth-token: ${token.substring(0, 15)}...`);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id);
                if (!req.user) {
                    console.warn(`[auth-debug] Legacy: User not found for ID: ${decoded.id}`);
                    if (isBypassEnabled) {
                        req.user = await getOrCreateDevUser();
                        return next();
                    }
                    return res.status(401).json({ error: 'Not authorized, user not found' });
                }
                if (req.user && req.user.isVerified === false && !isBypassEnabled) {
                    console.warn(`[auth-debug] Legacy: User ${req.user.email} is not verified.`);
                    return res.status(401).json({ error: 'Please verify your email address to continue.', needsVerification: true });
                }
                if (typeof decoded.tokenVersion !== 'undefined') {
                    const current = req.user.tokenVersion || 0;
                    if (decoded.tokenVersion !== current) {
                        console.warn(`[auth-debug] Legacy: Token version mismatch.`);
                        return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
                    }
                }
                next();
            } catch (error) {
                console.error(`[auth-debug] Legacy verification failed: ${error.message}`);
                if (isBypassEnabled) {
                    req.user = await getOrCreateDevUser();
                    return next();
                }
                res.status(401).json({ error: 'Not authorized, token failed' });
            }
        } else {
            console.warn(`[auth-debug] Missing authorization header for route: ${req.method} ${req.originalUrl}`);
            if (isBypassEnabled) {
                req.user = await getOrCreateDevUser();
                if (req.user) {
                    return next();
                }
                return res.status(401).json({ error: 'Not authorized, no users in DB to bypass' });
            }
            res.status(401).json({ error: 'Not authorized, no token provided' });
        }
    }
};

module.exports = { authMiddleware };
