const express = require('express');
const router = express.Router();
const {
    getMarketData,
    getCryptoBySymbol,
    getTrendingSearches,
    getSearchHistory,
    logSearchEndpoint,
    searchUniversalSymbols,
    syncUniversalSymbols,
} = require('../controllers/marketController');
const { getHistory } = require('../controllers/historyController');
const { getOrderBook } = require('../controllers/depthController');
const { getStatus } = require('../controllers/statusController');
const { getMarketNews, getNewsInsight } = require('../controllers/newsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getMarketData: getUnifiedData } = require('../services/marketDataService');
const { validateRequest, validateSymbolParam } = require('../middleware/validationMiddleware');
const freeApiAggregator = require('../services/freeApiAggregator');
const { getFundamentals } = require('../services/fundamentalsEnrichmentService');
const logger = require('../config/logger');

router.get('/', getMarketData);

router.get('/search/trending', getTrendingSearches);
router.post('/search/log', logSearchEndpoint);
router.get('/search/history', authMiddleware, getSearchHistory);
router.get('/search', searchUniversalSymbols);
router.post('/search/sync', syncUniversalSymbols);

router.get('/history', getHistory);
router.get('/depth', getOrderBook);
router.get('/status', getStatus);
router.get('/news', getMarketNews);
router.post('/news/insight', getNewsInsight);

router.get('/crypto/:symbol', validateSymbolParam, validateRequest, getCryptoBySymbol);

router.get('/forex/:symbol', validateSymbolParam, validateRequest, async (req, res) => {
    try {
        const data = await getUnifiedData('forex', req.params.symbol);
        res.json({ success: true, data });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

router.get('/stock/:symbol', validateSymbolParam, validateRequest, async (req, res) => {
    try {
        const data = await getUnifiedData('stock', req.params.symbol);
        res.json({ success: true, data });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

const yahooFinanceService = require('../services/yahooFinanceService');
const OHLC = require('../models/OHLC');

async function getStockQuoteAndSparkline(sym) {
    let cleanSymbol = sym.trim().toUpperCase().replace(/^NSE:/i, '').replace(/\.(NS|BO)$/i, '');
    let yahooSymbol = sym.trim().toUpperCase().replace(/^NSE:/i, '');
    let mongoSymbol = cleanSymbol;

    if (cleanSymbol === 'NIFTY' || cleanSymbol === 'NIFTY50' || cleanSymbol === '^NSEI' || cleanSymbol === 'NIFTY 50') {
        yahooSymbol = '^NSEI';
        mongoSymbol = 'NIFTY';
        cleanSymbol = 'NIFTY';
    } else if (cleanSymbol === 'SENSEX' || cleanSymbol === 'BSESN' || cleanSymbol === '^BSESN') {
        yahooSymbol = '^BSESN';
        mongoSymbol = 'SENSEX';
        cleanSymbol = 'SENSEX';
    } else if (cleanSymbol === 'BANKNIFTY' || cleanSymbol === '^NSEBANK' || cleanSymbol === 'NIFTY BANK') {
        yahooSymbol = '^NSEBANK';
        mongoSymbol = 'BANKNIFTY';
        cleanSymbol = 'BANKNIFTY';
    } else if (!yahooSymbol.includes('.') && !['BTC','ETH','SOL','XRP','BNB','ADA','DOT','DOGE','USDT'].some(c => cleanSymbol.includes(c))) {
        yahooSymbol = cleanSymbol + '.NS';
    }

    let currentPrice = 0;
    let latestClose = 0;
    let percentChange = 0;
    let sparklineData = [];
    let high = null;
    let low = null;
    let open = null;
    let volume = null;
    let priceSource = 'unknown';
    let lastUpdated = new Date().toISOString();

    // STEP 2 & STEP 3 & STEP 4 & STEP 5: Try Yahoo Finance API (Intraday + Daily)
    try {
        const [yResIntra, yResDaily] = await Promise.all([
            yahooFinanceService.fetchHistoricalData(yahooSymbol, '15m', '5d'),
            yahooFinanceService.fetchHistoricalData(yahooSymbol, '1d', '5d')
        ]);

        if (yResIntra.success && yResIntra.data && yResIntra.data.length > 0) {
            priceSource = 'yahoo';
            const intraData = yResIntra.data;
            const latestIntraCandle = intraData[intraData.length - 1];
            currentPrice = latestIntraCandle.close;

            // Extract daily previous close and metrics from daily candles
            if (yResDaily.success && yResDaily.data && yResDaily.data.length > 0) {
                const dailyData = yResDaily.data;
                const latestDailyCandle = dailyData[dailyData.length - 1];
                const prevDailyCandle = dailyData.length > 1 ? dailyData[dailyData.length - 2] : latestDailyCandle;
                latestClose = prevDailyCandle.close;
                high = latestDailyCandle.high;
                low = latestDailyCandle.low;
                open = latestDailyCandle.open;
                volume = latestDailyCandle.volume;
            } else {
                latestClose = intraData.length > 1 ? intraData[intraData.length - 2].close : currentPrice;
                high = latestIntraCandle.high;
                low = latestIntraCandle.low;
                open = latestIntraCandle.open;
                volume = latestIntraCandle.volume;
            }

            percentChange = latestClose > 0 ? ((currentPrice - latestClose) / latestClose) * 100 : 0;
            sparklineData = intraData.slice(-35).map(c => ({ value: c.close, timestamp: c.timestamp }));
            lastUpdated = latestIntraCandle.timestamp ? new Date(latestIntraCandle.timestamp).toISOString() : new Date().toISOString();

            // Asynchronously upsert latest daily candles to MongoDB OHLC collection for future fallback
            if (yResDaily.success && yResDaily.data) {
                setTimeout(async () => {
                    try {
                        for (const c of yResDaily.data.slice(-5)) {
                            await OHLC.updateOne(
                                { symbol: mongoSymbol, exchange: 'NSE', timeframe: '1d', timestamp: c.timestamp },
                                { $set: { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume } },
                                { upsert: true }
                            );
                        }
                    } catch(err) {
                        logger.error(`Failed to upsert OHLC for ${mongoSymbol}: ${err.message}`);
                    }
                }, 0);
            }
        }
    } catch(err) {
        logger.error(`Yahoo fetch failed for ${yahooSymbol}: ${err.message}`);
    }

    if (priceSource === 'unknown') {
        // STEP 3: FALLBACK TO LATEST OHLC CANDLES
        try {
            const recentCandles = await OHLC.find({
                symbol: { $in: [mongoSymbol, cleanSymbol, cleanSymbol + '.NS'] },
                timeframe: '1d'
            }).sort({ timestamp: -1 }).limit(35).lean();

            if (recentCandles && recentCandles.length > 0) {
                priceSource = 'mongodb-ohlc';
                const ohlcData = recentCandles.reverse(); // oldest to newest
                const latestCandle = ohlcData[ohlcData.length - 1];
                const prevCandle = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2] : latestCandle;
                currentPrice = latestCandle.close;
                latestClose = prevCandle.close;
                percentChange = latestClose > 0 ? ((currentPrice - latestClose) / latestClose) * 100 : 0;
                sparklineData = ohlcData.map(c => ({ value: c.close, timestamp: c.timestamp }));
                high = latestCandle.high;
                low = latestCandle.low;
                open = latestCandle.open;
                volume = latestCandle.volume;
                lastUpdated = latestCandle.timestamp ? new Date(latestCandle.timestamp).toISOString() : new Date().toISOString();
            }
        } catch(err) {
            logger.error(`MongoDB OHLC fallback failed for ${mongoSymbol}: ${err.message}`);
        }
    }

    if (priceSource === 'unknown') {
        // Final safety net: freeApiAggregator
        try {
            const fallbackQuote = await freeApiAggregator.getQuote(sym);
            if (fallbackQuote?.data) {
                priceSource = fallbackQuote.source || 'aggregator';
                const pData = fallbackQuote.data;
                currentPrice = Number(pData.current ?? pData.close ?? pData.ltp ?? 100);
                percentChange = Number(pData.changePercent ?? pData.change ?? 0);
                latestClose = Number(pData.previousClose ?? currentPrice);
                high = pData.high ?? null;
                low = pData.low ?? null;
                open = pData.open ?? null;
                volume = pData.volume ?? null;
                sparklineData = Array.from({ length: 15 }, (_, i) => ({
                    value: Math.max(1, currentPrice * (1 + (i % 3 - 1) * 0.003)),
                    timestamp: new Date(Date.now() - (15 - i) * 86400000)
                }));
                lastUpdated = pData.timestamp ? new Date(pData.timestamp).toISOString() : new Date().toISOString();
            }
        } catch(err) {
            logger.error(`freeApiAggregator fallback failed for ${sym}: ${err.message}`);
        }
    }

    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    const isClosed = day === 0 || day === 6 || hour < 3 || hour > 10;
    const marketStatus = isClosed ? 'closed' : 'open';
    const trendDirection = percentChange >= 0 ? 'up' : 'down';

    return {
        currentPrice,
        percentChange,
        latestClose,
        sparklineData,
        trendDirection,
        marketStatus,
        lastUpdated,
        high,
        low,
        open,
        volume,
        priceSource
    };
}

/**
 * GET /api/market/quotes?symbols=HDFCBANK.NS,RELIANCE.NS,...
 *
 * Returns price quote + enriched fundamentals (PE, beta, ROE, delivery %,
 * 1M momentum, sector) for each requested symbol.
 *
 * Price: getStockQuoteAndSparkline (Yahoo Finance / OHLC Cache / Twelve Data / Finnhub)
 * Fundamentals: yahoo-finance2 quoteSummary (cached 6h)
 */
router.get('/quotes', async (req, res) => {
    try {
        const symbolsParam = String(req.query.symbols || '').trim();
        if (!symbolsParam) {
            return res.status(400).json({ success: false, message: 'symbols query param is required' });
        }

        const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);
        if (symbols.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid symbols provided' });
        }

        logger.info(`[/market/quotes] Requested: ${symbols.join(', ')}`);

        // Run price & sparkline fetches in parallel
        const priceResults = await Promise.all(
            symbols.map(sym => getStockQuoteAndSparkline(sym))
        );

        // Build enriched responses
        const enriched = await Promise.all(
            priceResults.map(async (resObj, i) => {
                const sym = symbols[i];
                const changePercent = resObj.percentChange;

                // Fetch fundamentals (6h cached — safe to call for every request)
                const fundamentals = await getFundamentals(sym, changePercent);

                return {
                    symbol:        sym,
                    price:         resObj.currentPrice,
                    changePercent: resObj.percentChange,
                    change:        resObj.percentChange,
                    high:          resObj.high,
                    low:           resObj.low,
                    open:          resObj.open,
                    volume:        resObj.volume,
                    // New STEP 5 explicit fields
                    currentPrice:  resObj.currentPrice,
                    percentChange: resObj.percentChange,
                    latestClose:   resObj.latestClose,
                    sparklineData: resObj.sparklineData,
                    trendDirection: resObj.trendDirection,
                    marketStatus:  resObj.marketStatus,
                    lastUpdated:   resObj.lastUpdated,
                    // Fundamentals
                    pe:            fundamentals.pe,
                    priceToBook:   fundamentals.priceToBook,
                    beta:          fundamentals.beta,
                    roe:           fundamentals.roe,
                    debtToEquity:  fundamentals.debtToEquity,
                    evToEbitda:    fundamentals.evToEbitda,
                    operatingMargins: fundamentals.operatingMargins,
                    profitMargins: fundamentals.profitMargins,
                    revenueGrowth: fundamentals.revenueGrowth,
                    epsGrowth:     fundamentals.epsGrowth,
                    profitGrowth:  fundamentals.profitGrowth,
                    currentRatio:  fundamentals.currentRatio,
                    interestCoverage: fundamentals.interestCoverage,
                    deliveryPct:   fundamentals.deliveryPct,
                    momentum:      fundamentals.momentum,
                    volumeRatio:   fundamentals.volumeRatio,
                    sector:        fundamentals.sector,
                    industry:      fundamentals.industry,
                    marketCap:     fundamentals.marketCap,
                    eps:           fundamentals.eps,
                    dividendYield: fundamentals.dividendYield,
                    bookValue:     fundamentals.bookValue,
                    valStatus:     fundamentals.valStatus,
                    industryPeAvg: fundamentals.industryPeAvg,
                    industryRoeAvg: fundamentals.industryRoeAvg,
                    industryMarginAvg: fundamentals.industryMarginAvg,
                    industryGrowthAvg: fundamentals.industryGrowthAvg,
                    // Crypto-native fields
                    category:      fundamentals.sector || 'Equity',
                    layer:         null,
                    consensus:     null,
                    tradeCount:    null,
                    // Source metadata
                    priceSource:   resObj.priceSource,
                    fundamentalSource: 'yahoo-finance2',
                    timestamp:     resObj.lastUpdated,
                };
            })
        );

        return res.json({ success: true, data: enriched });
    } catch (err) {
        logger.error('[/market/quotes] Error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch quotes', error: err.message });
    }
});

module.exports = router;

