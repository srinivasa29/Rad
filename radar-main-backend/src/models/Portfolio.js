const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        cashBalance: {
            type: Number,
            default: 100000
        },
        holdings: [
            {
                symbol: String,
                quantity: Number,
                avgBuyPrice: Number,
                assetType: { type: String, enum: ['STOCK', 'CRYPTO', 'FOREX'] }
            }
        ],
        history: [
            {
                date: { type: Date, default: Date.now },
                totalValue: Number
            }
        ],
        totalTrades: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Portfolio', PortfolioSchema);
