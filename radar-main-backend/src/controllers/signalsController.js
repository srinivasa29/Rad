const { issueSignalStreamToken } = require('../services/signalTokenService');

const issueStreamToken = async (req, res) => {
    try {
        const scope = Array.isArray(req.query.scope)
            ? req.query.scope
            : String(req.query.scope || 'signals:read')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

        const token = await issueSignalStreamToken(req.user, scope);
        return res.json({ success: true, data: token });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to issue stream token',
        });
    }
};

module.exports = {
    issueStreamToken,
};
