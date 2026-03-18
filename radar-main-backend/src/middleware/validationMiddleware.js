const { validationResult, param, query, body } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation Error", errors: errors.array() });
    }
    next();
};

const validateAssetType = param('assetType')
    .optional()
    .isIn(['crypto', 'stock', 'forex', 'CRYPTO', 'STOCK', 'FOREX'])
    .withMessage('Invalid asset type');

const validateAssetTypeBody = body('assetType')
    .optional()
    .isIn(['crypto', 'stock', 'forex', 'CRYPTO', 'STOCK', 'FOREX'])
    .withMessage('Invalid asset type');

const validateSymbolParam = param('symbol')
    .optional()
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Symbol is required');

const validateSymbolQuery = query('symbol')
    .optional()
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Symbol is required');

const validateSymbolBody = body('symbol')
    .exists()
    .isString()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Symbol is required');

const validateTradeAction = body('action')
    .exists()
    .isIn(['BUY', 'SELL', 'buy', 'sell'])
    .withMessage('Action must be BUY or SELL');

const validateQuantityPrice = [
    body('quantity').exists().isFloat({ gt: 0 }).withMessage('Quantity must be positive'),
    body('price').exists().isFloat({ gt: 0 }).withMessage('Price must be positive')
];

module.exports = {
    validateRequest,
    validateAssetType,
    validateAssetTypeBody,
    validateSymbolParam,
    validateSymbolQuery,
    validateSymbolBody,
    validateTradeAction,
    validateQuantityPrice
};
