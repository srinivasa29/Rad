const express = require('express');
const router = express.Router();
const { getNotes, addNote, deleteNote } = require('../controllers/noteController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:symbol', getNotes);
router.post('/', addNote);
router.delete('/:id', deleteNote);

module.exports = router;
