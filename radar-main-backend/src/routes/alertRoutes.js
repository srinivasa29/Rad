const express = require('express');
const router = express.Router();
const { createAlert, getAlerts, deleteAlert } = require('../controllers/alertController');
const { createAlertRule, getAlertRules, testAlertRules } = require('../controllers/alertsRuleController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createAlert);
router.get('/', getAlerts);
router.delete('/:id', deleteAlert);

router.post('/rules', createAlertRule);
router.get('/rules', getAlertRules);
router.get('/rules/test', testAlertRules);

module.exports = router;
