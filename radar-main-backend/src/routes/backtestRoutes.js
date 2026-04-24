const express = require('express');
const router = express.Router();
const { runBacktest, getBacktestStatus } = require('../controllers/backtestController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/run', authMiddleware, runBacktest);
router.get('/:id', authMiddleware, getBacktestStatus);

module.exports = router;
