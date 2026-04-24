const express = require('express');
const router = express.Router();
const { getCorporateActions, getEconomicEvents } = require('../controllers/calendarController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/actions', authMiddleware, getCorporateActions);
router.get('/economic', getEconomicEvents);

module.exports = router;
