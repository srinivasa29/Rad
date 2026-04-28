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
const { getMarketNews } = require('../controllers/newsController');
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

/**
 * GET /api/market/quotes?symbols=HDFCBANK.NS,RELIANCE.NS,...
 *
 * Returns price quote + enriched fundamentals (PE, beta, ROE, delivery %,
 * 1M momentum, sector) for each requested symbol.
 *
 * Price: freeApiAggregator (Twelve Data / Finnhub / Yahoo cache)
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

        // Run price fetches in parallel (with a small delay between to avoid rate limits)
        const priceResults = await Promise.all(
            symbols.map(sym => freeApiAggregator.getQuote(sym))
        );

        // Build enriched responses
        const enriched = await Promise.all(
            priceResults.map(async (priceRes, i) => {
                const sym = symbols[i];
                const priceData = priceRes?.data || {};
                const changePercent = Number(priceData.changePercent ?? priceData.change ?? 0);

                // Fetch fundamentals (6h cached — safe to call for every request)
                const fundamentals = await getFundamentals(sym, changePercent);

                return {
                    symbol:        sym,
                    price:         priceData.current ?? priceData.close ?? null,
                    changePercent,
                    change:        changePercent,
                    high:          priceData.high  ?? null,
                    low:           priceData.low   ?? null,
                    open:          priceData.open  ?? null,
                    volume:        priceData.volume ?? null,
                    // Fundamentals
                    pe:            fundamentals.pe,
                    beta:          fundamentals.beta,
                    roe:           fundamentals.roe,
                    debtToEquity:  fundamentals.debtToEquity,
                    revenueGrowth: fundamentals.revenueGrowth,
                    profitMargins: fundamentals.profitMargins,
                    deliveryPct:   fundamentals.deliveryPct,
                    momentum:      fundamentals.momentum,
                    volumeRatio:   fundamentals.volumeRatio,
                    sector:        fundamentals.sector,
                    industry:      fundamentals.industry,
                    marketCap:     fundamentals.marketCap,
                    valStatus:     fundamentals.valStatus,
                    // Crypto-native fields
                    category:      priceData.category || fundamentals.sector,
                    layer:         priceData.layer || null,
                    consensus:     priceData.consensus || null,
                    tradeCount:    priceData.tradeCount || null,
                    // Source metadata
                    priceSource:   priceRes?.source || 'unknown',
                    fundamentalSource: 'yahoo-finance2',
                    timestamp:     new Date().toISOString(),
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

