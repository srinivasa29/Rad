const express = require('express');
const router = express.Router();
const {
    getHistoricalData,
    getLatestCandle,
    getAvailableSymbols,
} = require('../controllers/ohlcController');
const { protect } = require('../middleware/authMiddleware');


router.get('/symbols/list', getAvailableSymbols);


router.get('/:symbol', getHistoricalData);


router.get('/:symbol/latest', getLatestCandle);

module.exports = router;
