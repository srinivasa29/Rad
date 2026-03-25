const mongoose = require('mongoose');

const RuleConditionSchema = new mongoose.Schema(
    {
        field: { type: String, required: true },
        operator: {
            type: String,
            enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'contains'],
            required: true,
        },
        value: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    { _id: false }
);

const AlertRuleSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        symbol: { type: String, required: true, uppercase: true, trim: true },
        assetType: {
            type: String,
            enum: ['STOCK', 'CRYPTO', 'FOREX'],
            default: 'STOCK',
        },
        logic: {
            type: String,
            enum: ['ALL', 'ANY'],
            default: 'ALL',
        },
        conditions: {
            type: [RuleConditionSchema],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: 'At least one condition is required',
            },
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        active: { type: Boolean, default: true },
        lastTriggeredAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AlertRule', AlertRuleSchema);
