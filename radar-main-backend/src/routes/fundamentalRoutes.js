const express = require('express');
const router = express.Router();
const { getValuationThermometer, getInvestmentIdeas, getPeerComparison, getMarketMoodIndex } = require('../controllers/fundamentalController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/valuation', getValuationThermometer);
router.get('/ideas', getInvestmentIdeas);
router.get('/peers/:symbol', authMiddleware, getPeerComparison);
router.get('/mood', getMarketMoodIndex);

module.exports = router;
