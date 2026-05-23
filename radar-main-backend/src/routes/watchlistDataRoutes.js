const express = require('express');
const router = express.Router();
const { getWatchlistData } = require('../controllers/watchlistDataController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/data', authMiddleware, getWatchlistData);

module.exports = router;
