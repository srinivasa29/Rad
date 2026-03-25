const {
    createRule,
    listRules,
    evaluateRules,
} = require('../services/alertRulesService');

const createAlertRule = async (req, res) => {
    try {
        const userId = req.user._id;
        const rule = await createRule(userId, req.body || {});
        return res.status(201).json({
            success: true,
            data: {
                id: String(rule._id),
                name: rule.name,
                symbol: rule.symbol,
                assetType: rule.assetType,
                logic: rule.logic,
                conditions: rule.conditions,
                severity: rule.severity,
                active: rule.active,
                createdAt: rule.createdAt,
            },
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to create alert rule',
        });
    }
};

const getAlertRules = async (req, res) => {
    try {
        const userId = req.user._id;
        const rules = await listRules(userId);
        return res.json({
            success: true,
            data: rules.map((rule) => ({
                id: String(rule._id),
                name: rule.name,
                symbol: rule.symbol,
                assetType: rule.assetType,
                logic: rule.logic,
                conditions: rule.conditions,
                severity: rule.severity,
                active: rule.active,
                lastTriggeredAt: rule.lastTriggeredAt,
                createdAt: rule.createdAt,
            })),
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to list alert rules',
        });
    }
};

const testAlertRules = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = await evaluateRules(userId);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to evaluate alert rules',
        });
    }
};

module.exports = {
    createAlertRule,
    getAlertRules,
    testAlertRules,
};
