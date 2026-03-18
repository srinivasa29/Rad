const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest, validateSymbolBody, validateSymbolParam, validateAssetTypeBody } = require('../middleware/validationMiddleware');

router.get('/', authMiddleware, getWatchlist);

router.post(
    '/',
    authMiddleware,
    validateSymbolBody,
    validateAssetTypeBody,
    validateRequest,
    addToWatchlist
);

router.delete('/:symbol', authMiddleware, validateSymbolParam, validateRequest, removeFromWatchlist);

router.get('/:persona', authMiddleware, getWatchlist);

router.post(
    '/:persona',
    authMiddleware,
    validateSymbolBody,
    validateAssetTypeBody,
    validateRequest,
    addToWatchlist
);

router.delete('/:persona/:symbol', authMiddleware, validateSymbolParam, validateRequest, removeFromWatchlist);

module.exports = router;
