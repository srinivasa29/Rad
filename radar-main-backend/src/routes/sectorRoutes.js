const express = require('express');
const router = express.Router();
const { getSectorPerformanceHandler } = require('../controllers/sectorController');
router.get('/performance', getSectorPerformanceHandler);

module.exports = router;
