const express = require('express');
const router = express.Router();
const { issueStreamToken } = require('../controllers/signalsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/stream-token', authMiddleware, issueStreamToken);

module.exports = router;
