const mongoose = require('mongoose');

const symbolSchema = new mongoose.Schema(
    {
        symbol: { type: String, required: true, trim: true, uppercase: true },
        name: { type: String, required: true, trim: true },
        exchange: { type: String, default: 'UNKNOWN', trim: true, uppercase: true },
        country: { type: String, default: 'GLOBAL', trim: true, uppercase: true },
        sector: { type: String, default: null },
        industry: { type: String, default: null },
        currency: { type: String, default: 'USD', trim: true, uppercase: true },
        assetType: {
            type: String,
            required: true,
            enum: ['equity', 'etf', 'forex', 'crypto', 'index', 'fund', 'other'],
            default: 'equity',
        },
        provider: { type: String, default: 'internal', trim: true },
        active: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

symbolSchema.index({ symbol: 1, exchange: 1, assetType: 1 }, { unique: true });
symbolSchema.index({ symbol: 1 });
symbolSchema.index({ name: 'text' });
symbolSchema.index({ assetType: 1, country: 1, active: 1 });

module.exports = mongoose.model('Symbol', symbolSchema);
