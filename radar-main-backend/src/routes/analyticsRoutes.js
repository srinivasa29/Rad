const express = require('express');
const router = express.Router();
const { getPreMarketPulse, getSectorHeatmap } = require('../controllers/analyticsController');
router.get('/pulse', getPreMarketPulse);
router.get('/heatmap', getSectorHeatmap);
module.exports = router;
