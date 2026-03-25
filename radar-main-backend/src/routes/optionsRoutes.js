const express = require('express');
const router = express.Router();
const { getChain, getGreeks } = require('../controllers/optionsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest, validateSymbolParam } = require('../middleware/validationMiddleware');

router.get('/:symbol/chain', authMiddleware, validateSymbolParam, validateRequest, getChain);
router.get('/:symbol/greeks', authMiddleware, validateSymbolParam, validateRequest, getGreeks);

module.exports = router;
