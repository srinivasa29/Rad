const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();

const registerUser = asyncHandler(async (req, res) => {
    const { username, password, email, identifier } = req.body;

    try {
        const normalizedUsername = String(username || '').trim();
        const normalizedEmail = normalizeIdentifier(email || identifier || '');
        const userExists = await User.findOne({
            $or: [
                { username: normalizedUsername },
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ],
        });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({
            username: normalizedUsername,
            password,
            ...(normalizedEmail ? { email: normalizedEmail } : {}),
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email || null,
                preferredMode: user.preferredMode,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        logger.error('Error during user registration:', error);
        res.status(400).json({ error: 'Invalid user data', details: error.message });
    }
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

const googleAuth = asyncHandler(async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                preferredMode: user.preferredMode,
                token: generateToken(user._id),
                picture: picture
            });
        } else {
            
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await User.create({
                username: name,
                email: email,
                password: randomPassword
            });

            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                preferredMode: user.preferredMode,
                token: generateToken(user._id),
                picture: picture
            });
        }
    } catch (error) {
        logger.error('Error during Google login:', error);
        res.status(400).json({ error: 'Google Login Failed', details: error.message });
    }
});


const loginUser = asyncHandler(async (req, res) => {
    const { username, identifier, password } = req.body;
    const loginId = String(username || identifier || '').trim();
    const normalized = normalizeIdentifier(loginId);

    try {
        if (!loginId || !password) {
            return res.status(400).json({ error: 'Username/email and password are required' });
        }

        const user = await User.findOne({
            $or: [
                { username: loginId },
                { email: normalized },
            ],
        });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email || null,
                preferredMode: user.preferredMode,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        logger.error('Error during user login:', error);
        res.status(500).json({ error: error.message });
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    res.json({
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email || null,
        preferredMode: req.user.preferredMode,
        watchlist: req.user.watchlist,
        settings: req.user.settings || {}
    });
});

const getMode = asyncHandler(async (req, res) => {
    res.json({ preferredMode: req.user.preferredMode });
});

const updateMode = asyncHandler(async (req, res) => {
    const { mode } = req.body;
    
    const user = req.user;

    user.preferredMode = mode;
    await user.save();
    res.json({ message: "Mode updated", preferredMode: user.preferredMode });
});

module.exports = { registerUser, loginUser, getUserProfile, getMode, updateMode, googleAuth };
