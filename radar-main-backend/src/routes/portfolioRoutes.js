const express = require('express');
const router = express.Router();
const { getPortfolio, executeTrade } = require('../controllers/portfolioController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest, validateSymbolBody, validateTradeAction, validateQuantityPrice, validateAssetTypeBody } = require('../middleware/validationMiddleware');

router.get('/', authMiddleware, getPortfolio);

router.post(
    '/trade',
    authMiddleware,
    validateSymbolBody,
    validateTradeAction,
    ...validateQuantityPrice,
    validateAssetTypeBody,
    validateRequest,
    executeTrade
);

module.exports = router;
