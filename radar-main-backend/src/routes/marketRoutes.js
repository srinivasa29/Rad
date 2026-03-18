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

module.exports = router;
