const express = require('express');
const router = express.Router();
const { runScreenerScan } = require('../controllers/screenerController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/run', authMiddleware, runScreenerScan);

module.exports = router;
