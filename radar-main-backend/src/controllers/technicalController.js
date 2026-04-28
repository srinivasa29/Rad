const Watchlist = require('../models/Watchlist');
const { fetchStockData } = require('../services/stockService');
const { getTechnicalIndicators, getTrendMatrix } = require('../services/indicatorService');
const { getInstrumentScore } = require('../services/scoringService');
const { detectPatterns } = require('../services/patternService');

const getWatchlistData = async (req, res) => {
    try {
        let customSymbols = null;
        if (req.user && req.user._id) {
            const watchlists = await Watchlist.find({ userId: req.user._id });
            if (watchlists && watchlists.length > 0) {
                const allSymbols = new Set();
                watchlists.forEach(wl => {
                    if (wl.items && Array.isArray(wl.items)) {
                        wl.items.forEach(item => {
                            if (item.symbol) allSymbols.add(item.symbol);
                        });
                    }
                });
                if (allSymbols.size > 0) {
                    customSymbols = Array.from(allSymbols);
                }
            }
        }

        const stocks = await fetchStockData(customSymbols);
        const technicalWatchlist = stocks.map(stock => {
            const currentPrice = stock.price;
            const vwap = (currentPrice * 0.98).toFixed(2);
            return {
                ...stock,
                technicals: {
                    vwap: vwap,
                    status: currentPrice > vwap ? "Above VWAP" : "Below VWAP",
                    sparkline: [
                        currentPrice - 2, currentPrice - 1, currentPrice - 1.5, currentPrice + 0.5, currentPrice
                    ]
                }
            };
        });
        res.json(technicalWatchlist);
    } catch (error) {
        console.error('Error in getWatchlistData:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getBreakoutAlerts = (req, res) => {
    res.json([
        { symbol: "NVDA", type: "Resistance Breakout", price: 460.18, time: "10:30 AM" },
        { symbol: "AMD", type: "52-Week High", price: 115.20, time: "11:15 AM" }
    ]);
};

const getIndicatorSignals = (req, res) => {
    res.json([
        { symbol: "AAPL", signal: "BULLISH", indicator: "RSI Oversold", strength: "High" },
        { symbol: "TSLA", signal: "BEARISH", indicator: "MACD Crossover", strength: "Medium" }
    ]);
};

const getQuickOrderData = (req, res) => {
    res.json({
        availableBalance: 25420.50,
        buyingPower: 101682.00,
        marginUsed: 0.00
    });
};

const strictLiveEnabled = (req) => String(req.query.strictLive || '').toLowerCase() === 'true';

const getIndicators = async (req, res) => {
    try {
        const { assetType, symbol } = req.params;
        const { interval = '1D' } = req.query;
        const data = await getTechnicalIndicators(assetType, symbol, interval, { strictLive: strictLiveEnabled(req) });
        res.json({ success: true, symbol, assetType, interval, ...data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTrend = async (req, res) => {
    try {
        const { assetType, symbol } = req.params;
        const matrix = await getTrendMatrix(assetType, symbol, { strictLive: strictLiveEnabled(req) });
        res.json({ success: true, symbol, assetType, trendMatrix: matrix });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getScore = async (req, res) => {
    try {
        const { assetType, symbol } = req.params;
        const result = await getInstrumentScore(assetType, symbol, { strictLive: strictLiveEnabled(req) });
        res.json({ success: true, symbol, assetType, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPatterns = async (req, res) => {
    try {
        const { assetType, symbol } = req.params;
        const patterns = await detectPatterns(assetType, symbol, { strictLive: strictLiveEnabled(req) });
        res.json({ success: true, symbol, assetType, patterns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSummary = async (req, res) => {
    try {
        const { assetType, symbol } = req.params;
        const options = { strictLive: strictLiveEnabled(req) };
        const [indicators, trendMatrix, scoreResult, patterns] = await Promise.allSettled([
            getTechnicalIndicators(assetType, symbol, '1D', options),
            getTrendMatrix(assetType, symbol, options),
            getInstrumentScore(assetType, symbol, options),
            detectPatterns(assetType, symbol, options)
        ]);

        res.json({
            success: true,
            symbol,
            assetType,
            indicators: indicators.status === 'fulfilled' ? indicators.value : null,
            trendMatrix: trendMatrix.status === 'fulfilled' ? trendMatrix.value : null,
            score: scoreResult.status === 'fulfilled' ? scoreResult.value : null,
            patterns: patterns.status === 'fulfilled' ? patterns.value : []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getWatchlistData,
    getBreakoutAlerts,
    getIndicatorSignals,
    getQuickOrderData,
    getIndicators,
    getTrend,
    getScore,
    getPatterns,
    getSummary
};
