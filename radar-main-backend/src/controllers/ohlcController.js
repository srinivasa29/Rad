const asyncHandler = require('express-async-handler');
const ohlcService = require('../services/ohlcService');
const stockDetailsService = require('../services/stockDetailsService');

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const getHistoricalData = async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1d' } = req.query;

        const chartService = require('../services/chartService');
        const chartData = await chartService.getChartData(symbol, interval, null, null, 365);

        const candles = chartData.map(c => ({
            datetime: new Date(c.time * 1000).toISOString(),
            timestamp: new Date(c.time * 1000).toISOString(),
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume
        }));

        return res.json({
            success: true,
            symbol,
            interval,
            count: candles.length,
            data: candles
        });

    } catch (error) {
        console.error('HISTORY ERROR:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const liveMarketService = require('../services/liveMarketService');

const getLatestCandle = asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    if (!symbol) {
        res.status(400);
        throw new Error('Symbol is required');
    }

    const result = await liveMarketService.getLiveMarketData(symbol);

    if (!result.success) {
        res.status(500);
        throw new Error(result.message || 'Failed to fetch live market data');
    }

    res.json({
        success: true,
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

const getChartData = asyncHandler(async (req, res) => {

    const { symbol } = req.params;
    //const { timeframe = '1Y' } = req.query;
    //const { interval = '1d' } = req.query;
    const {
        interval = '1d',
        daysBack = 365,
        period1,
        period2
    } = req.query;

    if (!symbol) {
        res.status(400);
        throw new Error('Symbol is required');
    }

    const chartService = require('../services/chartService');

    /*let interval = '1d';

    // Convert frontend timeframe to Yahoo intervals
    if (timeframe === '1D') interval = '1d';
    else if (timeframe === '5D') interval = '1h';
    else if (timeframe === '1M') interval = '1h';
    else if (timeframe === '3M') interval = '1d';
    else if (timeframe === '6M') interval = '1d';
    else if (timeframe === '1Y') interval = '1d';
    else if (timeframe === '5Y') interval = '1wk';*/

    /*const data = await chartService.getChartData(
        symbol,
        interval
    );*/
    const data = await chartService.getChartData(
        symbol,
        interval,
        period1,
        period2,
        Number(daysBack)
    );

    res.json({
        success: true,
        symbol,
        interval,
        daysBack,
        data
    });

});
/*const getStockDetails = asyncHandler(async (req, res) => {

    const { symbol } = req.params;

    if (!symbol) {
        res.status(400);
        throw new Error('Symbol is required');
    }

    const data = await stockDetailsService.getStockDetails(symbol);

    res.json({
        success: true,
        data
    });
});*/
const getStockDetails = asyncHandler(async (req, res) => {

    try {

        const { symbol } = req.params;

        if (!symbol) {
            res.status(400);
            throw new Error('Symbol is required');
        }

        const data = await stockDetailsService.getStockDetails(symbol);

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error('STOCK DETAILS ERROR:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
module.exports = {
    getHistoricalData,
    getLatestCandle,
    getAvailableSymbols,
    getCompareData,
    getChartData,
    getStockDetails
};
