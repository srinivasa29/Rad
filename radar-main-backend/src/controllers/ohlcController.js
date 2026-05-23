const asyncHandler = require('express-async-handler');
const ohlcService = require('../services/ohlcService');
const yahooFinanceService = require('../services/yahooFinanceService');
const logger = require('../config/logger');

const buildYahooRange = (timeframe, limit) => {
    const interval = String(timeframe || '1d').toLowerCase();
    const candles = Number(limit || 365);
    const intradayMinutes = {
        '1m': 1,
        '2m': 2,
        '5m': 5,
        '10m': 15,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '4h': 60,
    };

    if (intradayMinutes[interval]) {
        const days = Math.min(59, Math.max(2, Math.ceil((candles * intradayMinutes[interval]) / (60 * 6.5)) + 2));
        return `${days}d`;
    }

    if (['1wk', '1w'].includes(interval)) return '5y';
    if (['1mo', '1m'].includes(interval)) return '10y';

    const days = Math.max(30, candles);
    if (days <= 30) return '1mo';
    if (days <= 90) return '3mo';
    if (days <= 180) return '6mo';
    if (days <= 365) return '1y';
    if (days <= 730) return '2y';
    return '5y';
};

const sliceToLimit = (data, limit) => {
    const parsedLimit = Number(limit);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) return data;
    return data.slice(-parsedLimit);
};


const getHistoricalData = asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const {
        exchange = 'NSE',
        timeframe = '1d',
        startDate,
        endDate,
        from,
        to,
        limit = 365,
    } = req.query;

    const actualStartDate = from || startDate;
    const actualEndDate = to || endDate;

    if (!symbol) {
        res.status(400);
        throw new Error('Symbol is required');
    }

    let result = { success: false, count: 0, data: [] };

    try {
        if (actualStartDate || actualEndDate) {
            const start = actualStartDate ? new Date(actualStartDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            const end = actualEndDate ? new Date(actualEndDate) : new Date();
            result = await yahooFinanceService.fetchCustomRange(symbol, start, end, timeframe, { exchange });
        } else {
            result = await yahooFinanceService.fetchHistoricalData(symbol, timeframe, buildYahooRange(timeframe, limit), { exchange });
        }

        if (result.success) {
            result.data = sliceToLimit(result.data, limit);
            result.count = result.data.length;
        }
    } catch (error) {
        logger.warn(`Yahoo OHLC fetch failed for ${symbol}: ${error.message}`);
    }

    if (!result.success || result.count === 0) {
        result = await ohlcService.getOHLCData({
            symbol,
            exchange,
            timeframe,
            startDate: actualStartDate,
            endDate: actualEndDate,
            limit: parseInt(limit),
        });
    }

    if (result.count === 0) {
        // Fallback to live data if DB is empty (e.g. crypto symbols)
        const { fetchCryptoHistory } = require('../services/cryptoService');
        const { fetchStockHistory } = require('../services/stockService');
        try {
            let fallbackData = [];
            const knownCryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOGE', 'DOT', 'BNB', 'MATIC', 'AVAX', 'LINK', 'LTC'];
            const bare = symbol.replace(/\.(NS|BO)$/i, '').replace(/-USD$/i, '');
            if (knownCryptos.includes(bare)) {
                fallbackData = await fetchCryptoHistory(bare, timeframe);
            } else {
                fallbackData = await fetchStockHistory(symbol, timeframe, { allowSynthetic: true });
            }
            if (fallbackData && fallbackData.length > 0) {
                result = {
                    success: true,
                    count: fallbackData.length,
                    data: fallbackData
                };
            }
        } catch (e) {
            console.error('OHLC Fallback failed:', e.message);
        }
    }

    if (!result.success) {
        res.status(500);
        throw new Error(result.message || 'Failed to fetch OHLC data');
    }

    res.json({
        success: true,
        symbol,
        exchange,
        timeframe,
        count: result.count,
        source: result.symbol ? 'yahoo-finance2' : 'ohlc-storage',
        data: result.data,
    });
});


const getLatestCandle = asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const { exchange = 'NSE', timeframe = '1d' } = req.query;

    if (!symbol) {
        res.status(400);
        throw new Error('Symbol is required');
    }

    const result = await ohlcService.getLatestOHLC(symbol, exchange, timeframe);

    if (!result.success) {
        res.status(500);
        throw new Error('Failed to fetch latest OHLC data');
    }

    if (!result.data) {
        res.status(404);
        throw new Error('No data found for this symbol');
    }

    res.json({
        success: true,
        symbol,
        exchange,
        timeframe,
        data: result.data,
    });
});


const getAvailableSymbols = asyncHandler(async (req, res) => {
    const { exchange } = req.query;
    const result = await ohlcService.getAvailableSymbols(exchange);
    if (!result.success) {
        res.status(500);
        throw new Error('Failed to fetch available symbols');
    }

    res.json({
        success: true,
        count: result.count,
        exchange: exchange || 'all',
        symbols: result.symbols,
    });
});

const getCompareData = asyncHandler(async (req, res) => {
    const { symbols, from, to, timeframe = '1d' } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
        res.status(400);
        throw new Error('Symbols array is required');
    }

    const results = {};
    const promises = symbols.map(async (sym) => {
        const result = await ohlcService.getOHLCData({
            symbol: sym,
            startDate: from,
            endDate: to,
            timeframe
        });
        if (result.success) {
            results[sym] = result.data;
        }
    });

    await Promise.all(promises);
    res.json(results);
});

module.exports = {
    getHistoricalData,
    getLatestCandle,
    getAvailableSymbols,
    getCompareData
};
