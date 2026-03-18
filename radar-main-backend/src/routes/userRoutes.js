const express = require('express');
const router = express.Router();
const { getUserProfile, getMode, updateMode } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, getUserProfile);
router.get('/mode', authMiddleware, getMode);
router.patch('/mode', authMiddleware, updateMode);

module.exports = router;
