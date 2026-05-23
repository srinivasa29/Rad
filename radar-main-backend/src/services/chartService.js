const mapSymbol = require('../utils/symbolMapper');

const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance();

const getChartData = async (
    symbol,
    interval = '1d',
    period1 = null,
    period2 = null,
    daysBack = 365
) => {

    const yahooSymbol = mapSymbol(symbol);

    const p1 = period1 ? new Date(Number(period1) * 1000) : new Date(Date.now() - Number(daysBack) * 24 * 60 * 60 * 1000);
    const p2 = period2 ? new Date(Number(period2) * 1000) : new Date();

    const result = await yahooFinance.chart(yahooSymbol, {
        period1: p1,
        period2: p2,
        interval
    });

    if (!result?.quotes) {
        return [];
    }

    return result.quotes.map((candle) => ({
        //time: Math.floor(new Date(candle.date).getTime() / 1000),
        time: Math.floor(new Date(candle.date).getTime() / 1000) + (5.5 * 60 * 60),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,

        volume: candle.volume || 0
    }));
};

module.exports = {
    getChartData
};