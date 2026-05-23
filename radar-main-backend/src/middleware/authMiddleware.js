const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }

            // If tokenVersion present in token, ensure it matches user's current tokenVersion
            if (typeof decoded.tokenVersion !== 'undefined') {
                const current = req.user.tokenVersion || 0;
                if (decoded.tokenVersion !== current) {
                    return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
                }
            }

            next();
        } catch (error) {
            const reason = error?.name === 'JsonWebTokenError' ? 'invalid signature' : error?.message || 'unknown';
            console.warn(`[auth] Token rejected (${reason}) — client should re-login`);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } else {
        
        if (req.headers['x-auth-token']) {
            try {
                token = req.headers['x-auth-token'];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
                if (!req.user) {
                    return res.status(401).json({ error: 'Not authorized, user not found' });
                }
                if (typeof decoded.tokenVersion !== 'undefined') {
                    const current = req.user.tokenVersion || 0;
                    if (decoded.tokenVersion !== current) {
                        return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
                    }
                }
                next();
            } catch (error) {
                res.status(401).json({ error: 'Not authorized, token failed' });
            }
        } else {
            res.status(401).json({ error: 'Not authorized, no token' });
        }
    }
};

module.exports = { authMiddleware };
