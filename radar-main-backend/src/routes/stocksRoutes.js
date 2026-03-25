const express = require('express');
const router = express.Router();
const {
    getFundamentals,
    getEarningsCalendar,
    getNewsSentiment,
} = require('../controllers/stockInsightsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest, validateSymbolParam } = require('../middleware/validationMiddleware');

router.get('/:symbol/fundamentals', authMiddleware, validateSymbolParam, validateRequest, getFundamentals);
router.get('/:symbol/earnings-calendar', authMiddleware, validateSymbolParam, validateRequest, getEarningsCalendar);
router.get('/:symbol/news-sentiment', authMiddleware, validateSymbolParam, validateRequest, getNewsSentiment);

module.exports = router;
