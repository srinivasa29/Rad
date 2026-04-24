const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Chart Settings
    chartType: { type: String, default: 'candlestick' },
    indicators: {
        type: Map,
        of: Boolean,
        default: { sma: true, ema: false, rsi: false, macd: false, stoch: false, vwap: false, bb: false, volume: true, obv: false, atr: false }
    },
    showVolume: { type: Boolean, default: true },

    // Time & Range
    defaultTimeframe: { type: String, default: '1D' },
    customDateRangeEnabled: { type: Boolean, default: false },
    timezone: { type: String, default: 'Auto' },

    // Alert Settings
    defaultAlertType: { type: String, default: 'Price Alert' },
    alertDelivery: { type: String, enum: ['app', 'mail', 'both'], default: 'both' },
    notificationSound: { type: Boolean, default: true },

    // Watchlist Settings
    defaultWatchlist: { type: String, default: 'Default' },
    autoAddStocks: { type: Boolean, default: false },

    // Appearance
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    showGrid: { type: Boolean, default: true },
    showCrosshair: { type: Boolean, default: true },

    // Interaction
    syncCharts: { type: Boolean, default: true },
    syncTimeframe: { type: Boolean, default: true },
    syncCrosshair: { type: Boolean, default: true },
    syncZoom: { type: Boolean, default: true },
    autoRefresh: { type: Boolean, default: true },

    // Data Settings
    refreshInterval: { type: String, default: 'Real-time' },
    defaultExchange: { type: String, default: 'NSE' },

    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
