const express = require('express');
const router = express.Router();
const { getLearnings } = require('../controllers/learningController');

router.get('/', getLearnings);

module.exports = router;
