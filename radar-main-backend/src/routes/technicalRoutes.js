const express = require('express');
const router = express.Router();
const { getWatchlistData, getIndicators, getTrend, getScore, getPatterns, getSummary, getBreakoutAlerts, getIndicatorSignals, getQuickOrderData } = require('../controllers/technicalController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateAssetType, validateSymbolParam, validateRequest } = require('../middleware/validationMiddleware');

router.get('/watchlist', authMiddleware, getWatchlistData);

router.get('/indicators/:assetType/:symbol',
    validateAssetType,
    validateSymbolParam,
    validateRequest,
    getIndicators
);

router.get('/trend/:assetType/:symbol',
    validateAssetType,
    validateSymbolParam,
    validateRequest,
    getTrend
);

router.get('/score/:assetType/:symbol',
    validateAssetType,
    validateSymbolParam,
    validateRequest,
    getScore
);

router.get('/patterns/:assetType/:symbol',
    validateAssetType,
    validateSymbolParam,
    validateRequest,
    getPatterns
);

router.get('/summary/:assetType/:symbol',
    validateAssetType,
    validateSymbolParam,
    validateRequest,
    getSummary
);

router.get('/alerts', authMiddleware, getBreakoutAlerts);
router.get('/signals', authMiddleware, getIndicatorSignals);
router.get('/depth/:symbol', authMiddleware, validateSymbolParam, validateRequest, getQuickOrderData);

module.exports = router;
