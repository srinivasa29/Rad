const express = require('express');
const router = express.Router();
const {
    getHistoricalData,
    getLatestCandle,
    getAvailableSymbols,
} = require('../controllers/ohlcController');
const { protect } = require('../middleware/authMiddleware');



router.get('/:symbol', getHistoricalData);


router.get('/:symbol/latest', getLatestCandle);


router.get('/symbols/list', getAvailableSymbols);

module.exports = router;
