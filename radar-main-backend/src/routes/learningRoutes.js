const express = require('express');
const router = express.Router();
const { getLearnings, getCourse, getProgress, saveProgress, submitQuiz } = require('../controllers/learningController');

router.get('/',                    getLearnings);
router.get('/:id',                 getCourse);
router.get('/progress/:userId',    getProgress);
router.post('/progress',           saveProgress);
router.post('/quiz',               submitQuiz);

module.exports = router;
