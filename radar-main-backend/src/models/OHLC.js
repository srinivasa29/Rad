const mongoose = require('mongoose');

/**
 * OHLC Time-Series Model for storing historical market data
 * Optimized for Indian stocks (NSE/BSE) with support for multiple timeframes
 * 
 * MongoDB Time-Series collections provide automatic compression and efficient queries
 */

const ohlcSchema = new mongoose.Schema({
    // Time field (required for time-series)
    timestamp: {
        type: Date,
        required: true,
    },
    // Metadata field (for grouping)
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    // Exchange (NSE, BSE, NYSE, NASDAQ, etc.)
    exchange: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['NSE', 'BSE', 'NYSE', 'NASDAQ', 'CRYPTO', 'FOREX'],
        default: 'NSE',
    },
    // Timeframe (1d, 1h, 15m, 5m, 1m)
    timeframe: {
        type: String,
        required: true,
        enum: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
        default: '1d',
    },
    // OHLC Data
    open: {
        type: Number,
        required: true,
    },
    high: {
        type: Number,
        required: true,
    },
    low: {
        type: Number,
        required: true,
    },
    close: {
        type: Number,
        required: true,
    },
    volume: {
        type: Number,
        default: 0,
    },
    // Additional metadata
    adjustedClose: {
        type: Number,
    },
    // Data source tracking
    source: {
        type: String,
        enum: ['yahoo', 'nse', 'twelvedata', 'alphavantage', 'manual'],
        default: 'yahoo',
    },
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'symbol',
        granularity: 'hours', // Optimize for hourly/daily data
    },
    expireAfterSeconds: 31536000, // Auto-delete data older than 1 year (365 days)
});

// Compound index for efficient queries
ohlcSchema.index({ symbol: 1, exchange: 1, timeframe: 1, timestamp: -1 });

const OHLC = mongoose.model('OHLC', ohlcSchema);

module.exports = OHLC;
