const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({ username, password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                preferredMode: user.preferredMode,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        res.status(400).json({ error: 'Invalid user data' });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

const googleAuth = async (req, res) => {
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
            
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
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
        res.status(400).json({ error: 'Google Login Failed', details: error.message });
    }
};


const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                preferredMode: user.preferredMode,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    res.json({
        _id: req.user._id,
        username: req.user.username,
        preferredMode: req.user.preferredMode,
        watchlist: req.user.watchlist
    });
};

const getMode = async (req, res) => {
    try {
        res.json({ preferredMode: req.user.preferredMode });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

const updateMode = async (req, res) => {
    const { mode } = req.body;

    
    const user = req.user;

    user.preferredMode = mode;
    await user.save();
    res.json({ message: "Mode updated", preferredMode: user.preferredMode });
};

module.exports = { registerUser, loginUser, getUserProfile, getMode, updateMode, googleAuth };
