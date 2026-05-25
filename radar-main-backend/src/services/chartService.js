const mapSymbol = require('../utils/symbolMapper');

const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance();

const getLocalOHLCFallback = async (symbol, interval, p1, p2) => {
    try {
        const cleanSym = symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');
        const OHLC = require('../models/OHLC');
        
        let timeframe = '1d';
        if (interval === '1m') timeframe = '1m';
        else if (interval === '5m') timeframe = '5m';
        else if (interval === '15m') timeframe = '15m';
        else if (interval === '1h') timeframe = '1h';
        else if (interval === '1d') timeframe = '1d';
        else if (interval === '1wk') timeframe = '1w';
        else if (interval === '1mo') timeframe = '1M';
        
        const data = await OHLC.find({
            symbol: new RegExp(`^${cleanSym}$`, 'i'),
            timeframe,
            timestamp: { $gte: p1, $lte: p2 }
        })
        .sort({ timestamp: 1 })
        .lean();
        
        if (data && data.length > 0) {
            console.log(`[chartService] Loaded ${data.length} chart candles from local OHLC DB for ${symbol}`);
            return {
                quotes: data.map(item => ({
                    date: item.timestamp,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume
                }))
            };
        }
    } catch (err) {
        console.error('Failed to load local OHLC fallback data:', err);
    }
    return null;
};

const generateMockChartData = (symbol, interval, p1, p2) => {
    console.log(`[chartService] Generating fallback mock chart data for ${symbol}`);
    const quotes = [];
    const fromTime = Math.floor(p1.getTime() / 1000);
    const toTime = Math.floor(p2.getTime() / 1000);
    
    let step = 86400; // 1d default
    if (interval === '1m') step = 60;
    else if (interval === '5m') step = 300;
    else if (interval === '15m') step = 900;
    else if (interval === '30m') step = 1800;
    else if (interval === '1h') step = 3600;
    else if (interval === '1wk') step = 86400 * 7;
    else if (interval === '1mo') step = 86400 * 30;
    
    let currentPrice = 150 + Math.random() * 100;
    const cleanSym = symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');
    if (cleanSym.includes('BTC')) currentPrice = 65000;
    else if (cleanSym.includes('ETH')) currentPrice = 3200;
    else if (cleanSym.includes('MSFT')) currentPrice = 420;
    else if (cleanSym.includes('AAPL')) currentPrice = 180;
    else if (cleanSym.includes('TSLA')) currentPrice = 175;
    
    const count = 100;
    let t = toTime - count * step;
    
    for (let i = 0; i < count; i++) {
        const change = currentPrice * (Math.random() - 0.47) * 0.025;
        const open = currentPrice;
        const close = currentPrice + change;
        const high = Math.max(open, close) + Math.random() * (currentPrice * 0.01);
        const low = Math.min(open, close) - Math.random() * (currentPrice * 0.01);
        const volume = Math.floor(50000 + Math.random() * 150000);
        
        quotes.push({
            date: new Date((t - (5.5 * 60 * 60)) * 1000),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume
        });
        
        currentPrice = close;
        t += step;
    }
    return { quotes };
};

const getChartData = async (
    symbol,
    interval = '1d',
    period1 = null,
    period2 = null,
    daysBack = 365
) => {

    const yahooSymbol = mapSymbol(symbol);

    let effectiveDaysBack = Number(daysBack);
    // Fetch extra days to account for weekends/holidays
    if (!period1) {
        if (effectiveDaysBack === 1) effectiveDaysBack = 4;
        else if (effectiveDaysBack === 5) effectiveDaysBack = 7;
        else if (effectiveDaysBack < 30) effectiveDaysBack += 5;
    }

    // Enforce Yahoo Finance strict limits to prevent API crashes
    if (interval === '1m' && effectiveDaysBack > 7) {
        effectiveDaysBack = 7;
    } else if (['2m', '5m', '15m', '30m', '90m'].includes(interval) && effectiveDaysBack > 60) {
        effectiveDaysBack = 60;
    } else if (interval === '1h' && effectiveDaysBack > 730) {
        effectiveDaysBack = 730;
    }

    const p1 = period1 ? new Date(Number(period1) * 1000) : new Date(Date.now() - effectiveDaysBack * 24 * 60 * 60 * 1000);
    const p2 = period2 ? new Date(Number(period2) * 1000) : new Date();

    let result;
    try {
        result = await yahooFinance.chart(yahooSymbol, {
            period1: p1,
            period2: p2,
            interval
        });
    } catch (error) {
        // Fallback for international symbols (e.g. WIT) where mapSymbol incorrectly appended .NS
        if (yahooSymbol !== symbol && yahooSymbol.endsWith('.NS')) {
            try {
                result = await yahooFinance.chart(symbol, {
                    period1: p1,
                    period2: p2,
                    interval
                });
            } catch (fallbackError) {
                result = await getLocalOHLCFallback(symbol, interval, p1, p2);
                if (!result) {
                    result = generateMockChartData(symbol, interval, p1, p2);
                }
            }
        } else {
            result = await getLocalOHLCFallback(symbol, interval, p1, p2);
            if (!result) {
                result = generateMockChartData(symbol, interval, p1, p2);
            }
        }
    }

    if (!result?.quotes || result.quotes.length === 0) {
        return [];
    }

    const mappedQuotes = result.quotes
        .filter(candle => 
            candle && 
            candle.open != null && 
            candle.high != null && 
            candle.low != null && 
            candle.close != null &&
            Number.isFinite(candle.open) && 
            Number.isFinite(candle.high) && 
            Number.isFinite(candle.low) && 
            Number.isFinite(candle.close) &&
            candle.open > 0 && 
            candle.high > 0 && 
            candle.low > 0 && 
            candle.close > 0 &&
            candle.high >= candle.low
        )
        .map((candle) => ({
            time: Math.floor(new Date(candle.date).getTime() / 1000) + (5.5 * 60 * 60),
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
            volume: Number(candle.volume) || 0,
            // Store date string for grouping
            dateStr: new Date(candle.date).toISOString().split('T')[0]
        }));

    // If period1 was not provided, we fetched extra data to cover weekends.
    // Now we must filter down to the actual requested `daysBack` number of trading days.
    if (!period1 && Number(daysBack) < 30) {
        // Find all unique trading dates in the results, sorted descending
        const uniqueDates = [...new Set(mappedQuotes.map(q => q.dateStr))].sort((a, b) => b.localeCompare(a));
        
        // Take only the requested number of recent trading days
        const requestedDates = new Set(uniqueDates.slice(0, Number(daysBack)));
        
        return mappedQuotes.filter(q => requestedDates.has(q.dateStr)).map(({ dateStr, ...rest }) => rest);
    }

    return mappedQuotes.map(({ dateStr, ...rest }) => rest);
};

module.exports = {
    getChartData
};