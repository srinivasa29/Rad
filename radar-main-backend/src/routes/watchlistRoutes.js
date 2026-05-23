const express = require('express');
const router = express.Router();
const { 
    getWatchlists, 
    createWatchlist, 
    addToWatchlist, 
    removeFromWatchlist,
    addToDefaultWatchlist,
    removeFromDefaultWatchlist,
    reorderWatchlist
} = require('../controllers/watchlistController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getWatchlists);
router.post('/', createWatchlist);
router.post('/add', addToDefaultWatchlist);
router.delete('/remove/:symbol', removeFromDefaultWatchlist);
router.patch('/reorder', reorderWatchlist);
router.post('/:id/add', addToWatchlist);
router.delete('/:id/remove/:symbol', removeFromWatchlist);

module.exports = router;

