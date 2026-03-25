const asyncHandler = require('express-async-handler');
const ohlcService = require('../services/ohlcService');
const logger = require('../config/logger');

/**
 * @desc    Get historical OHLC data for a symbol
 * @route   GET /api/ohlc/:symbol
 * @access  Public
 */
const getHistoricalData = asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const {
        exchange = 'NSE',
        timeframe = '1d',
        startDate,
        endDate,
        limit = 365,
    } = req.query;

    // Validate symbol
    if (!symbol) {
        res.status(400);
        throw new Error('Symbol is required');
    }

    // Get data from service
    const result = await ohlcService.getOHLCData({
        symbol,
        exchange,
        timeframe,
        startDate,
        endDate,
        limit: parseInt(limit),
    });

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
        data: result.data,
    });
});

/**
 * @desc    Get latest OHLC candle for a symbol
 * @route   GET /api/ohlc/:symbol/latest
 * @access  Public
 */
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

/**
 * @desc    Get list of available symbols
 * @route   GET /api/ohlc/symbols/list
 * @access  Public
 */
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

module.exports = {
    getHistoricalData,
    getLatestCandle,
    getAvailableSymbols,
};
