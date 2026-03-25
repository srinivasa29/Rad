const mongoose = require('mongoose');

const BacktestJobSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['queued', 'running', 'completed', 'failed'],
            default: 'queued',
            index: true,
        },
        request: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        error: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('BacktestJob', BacktestJobSchema);
