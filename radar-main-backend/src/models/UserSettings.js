const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    display: {
        chartType: { type: String, default: 'candlestick' },
        defaultTimeframe: { type: String, default: '5m' },
        defaultLayout: { type: String, default: '4-grid' },
        theme: { type: String, default: 'dark' },
        showGridLines: { type: Boolean, default: true },
        showIndicators: { type: Boolean, default: false },
        showCrosshair: { type: Boolean, default: true }
    },
    dashboard: {
        defaultModule: { type: String, default: 'DASHBOARD' },
        autoRefreshWatchlist: { type: Boolean, default: true }
    },
    alerts: {
        priceAlerts: { type: Boolean, default: true },
        volumeSpikes: { type: Boolean, default: true },
        technicalSignals: { type: Boolean, default: true },
        marketNewsAlerts: { type: Boolean, default: true },
        method: { type: String, enum: ['in-app','email','both'], default: 'in-app' },
        soundEnabled: { type: Boolean, default: true }
    },
    risk: {
        defaultStopLossPct: { type: Number, default: 2 },
        defaultTakeProfitPct: { type: Number, default: 5 },
        positionSizeLimitPct: { type: Number, default: 10 },
        maxDrawdownTolerancePct: { type: Number, default: 15 }
    },
    data: {
        realtimeRefreshRate: { type: String, default: '1s' },
        quoteUpdateFreq: { type: String, default: '5s' },
        autoRefreshWatchlist: { type: Boolean, default: true },
        refreshInterval: { type: String, default: '1m' }
    },
    // New Platform configurations
    terminal: {
        defaultLandingPage: { type: String, default: 'Dashboard' },
        defaultChartTimeframe: { type: String, default: '5m' },
        defaultChartType: { type: String, default: 'Candlestick' },
        enableLiveMarketPulse: { type: Boolean, default: true },
        enableFloatingWatchlist: { type: Boolean, default: false },
        enableQuickResearchPanel: { type: Boolean, default: true }
    },
    marketDisplay: {
        defaultMarket: { type: String, default: 'NSE' },
        currencyFormat: { type: String, default: 'INR' },
        timezone: { type: String, default: 'Asia/Kolkata' },
        theme: { type: String, default: 'Dark' },
        numberFormat: { type: String, default: 'Indian' },
        showMarketStatusBadge: { type: Boolean, default: true },
        enableRealTimePriceAnimations: { type: Boolean, default: true }
    },
    notifications: {
        soundAlerts: { type: Boolean, default: true },
        desktopNotifications: { type: Boolean, default: true },
        highVolatilityAlerts: { type: Boolean, default: true },
        gapUpDownAlerts: { type: Boolean, default: false }
    },
    security: {
        twoFactorAuth: { type: Boolean, default: false },
        sessionTimeout: { type: Number, default: 30 }
    }
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
