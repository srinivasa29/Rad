const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const SignalStreamToken = require('../models/SignalStreamToken');
const logger = require('../config/logger');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueSignalStreamToken = async (user, scope = ['signals:read']) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        const error = new Error('JWT_SECRET is not configured');
        error.statusCode = 500;
        throw error;
    }

    const expiresInSec = 15 * 60;
    const expiresAt = new Date(Date.now() + expiresInSec * 1000);
    const payload = {
        sub: String(user.id),
        email: user.email,
        scope,
        type: 'signal-stream',
    };

    const token = jwt.sign(payload, jwtSecret, {
        expiresIn: expiresInSec,
        issuer: 'radar-backend',
        audience: 'radar-signals',
    });
    const tokenHash = hashToken(token);

    await SignalStreamToken.create({
        user: user.id,
        tokenHash,
        expiresAt,
        scope,
    });

    return {
        token,
        expiresAt: expiresAt.toISOString(),
        scope,
    };
};

const validateSignalStreamToken = async (token) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return { valid: false, reason: 'jwt-not-configured' };
    }

    try {
        const decoded = jwt.verify(token, jwtSecret, {
            issuer: 'radar-backend',
            audience: 'radar-signals',
        });
        const tokenHash = hashToken(token);
        const record = await SignalStreamToken.findOne({
            tokenHash,
            revoked: false,
            expiresAt: { $gt: new Date() },
        });

        if (!record) {
            return { valid: false, reason: 'token-not-found-or-expired' };
        }

        return { valid: true, decoded, scope: record.scope };
    } catch (error) {
        logger.warn(`Signal stream token validation failed: ${error.message}`);
        return { valid: false, reason: 'invalid-token' };
    }
};

module.exports = {
    issueSignalStreamToken,
    validateSignalStreamToken,
};
