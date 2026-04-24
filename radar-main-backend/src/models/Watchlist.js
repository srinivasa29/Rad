const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    items: [{
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

WatchlistSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', WatchlistSchema);
