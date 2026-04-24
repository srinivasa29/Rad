const express = require('express');
const router = express.Router();
const { getPortfolio, executeTrade } = require('../controllers/portfolioController');
const { getPortfolioRisk } = require('../controllers/portfolioRiskController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest, validateSymbolBody, validateTradeAction, validateQuantityPrice, validateAssetTypeBody } = require('../middleware/validationMiddleware');

router.get('/', authMiddleware, getPortfolio);
router.get('/risk', authMiddleware, getPortfolioRisk);

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
