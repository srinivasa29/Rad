/**
 * symbolRegistry.js
 * Central dynamic symbol resolver — fetches active symbols from the database.
 * All services should use this instead of hardcoded arrays.
 *
 * Resolution order:
 *   1. Symbol collection (active equity/etf, NSE/BSE)
 *   2. OHLC collection distinct symbols (for already-backfilled data)
 *   3. Minimal seed list (first-run guard only)
 */

const logger = require('./logger');

// Lazy-loaded to avoid circular deps at require-time
let _Symbol = null;
let _OHLC = null;

const getModels = () => {
    if (!_Symbol) _Symbol = require('../models/Symbol');
    if (!_OHLC)   _OHLC   = require('../models/OHLC');
    return { Symbol: _Symbol, OHLC: _OHLC };
};

// Comprehensive seed — covers Nifty 50 + key Next 50 picks
// Used ONLY when DB is completely empty (first run) or as emergency fallback
const SEED_SYMBOLS = [
    // Nifty 50
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
    'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH',
    'BAJFINANCE', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'NESTLEIND',
    'SUNPHARMA', 'TECHM', 'ONGC', 'NTPC', 'POWERGRID',
    'M&M', 'TATASTEEL', 'ADANIPORTS', 'BAJAJFINSV', 'JSWSTEEL',
    'INDUSINDBK', 'TATAMOTORS', 'HINDALCO', 'DIVISLAB', 'COALINDIA',
    'DRREDDY', 'EICHERMOT', 'CIPLA', 'GRASIM', 'BRITANNIA',
    'HEROMOTOCO', 'SHREECEM', 'APOLLOHOSP', 'UPL', 'BPCL',
    'TATACONSUM', 'SBILIFE', 'ADANIENT', 'HDFCLIFE', 'BAJAJ-AUTO',
    // Key Nifty Next 50
    'DMART', 'DLF', 'IRCTC', 'HAVELLS', 'PIDILITIND',
    'SIEMENS', 'TRENT', 'VEDL', 'COLPAL', 'DABUR',
    'MARICO', 'LUPIN', 'PFC', 'RECLTD', 'GAIL',
    'IOC', 'BEL', 'BANKBARODA', 'CANBK', 'PNB',
    // Key Midcap / Sectoral
    'ZOMATO', 'NAUKRI', 'PERSISTENT', 'COFORGE', 'MPHASIS',
    'TATAPOWER', 'ADANIGREEN', 'IRFC', 'RVNL', 'HAL',
];

const SEED_SYMBOLS_NS = SEED_SYMBOLS.map(s => `${s}.NS`);

/**
 * Fetch active equity/ETF symbols (bare, no .NS suffix).
 * @param {object}  opts
 * @param {string[]} opts.exchanges  - default ['NSE','BSE','UNKNOWN']
 * @param {string[]} opts.assetTypes - default ['equity','etf']
 * @param {boolean}  opts.withSuffix - return 'SYMBOL.NS' instead of 'SYMBOL'
 * @returns {Promise<string[]>}
 */
const getActiveSymbols = async (opts = {}) => {
    const {
        exchanges  = ['NSE', 'BSE', 'UNKNOWN'],
        assetTypes = ['equity', 'etf'],
        withSuffix = false,
    } = opts;

    const { Symbol, OHLC } = getModels();
    const stripSuffix = s => String(s || '').replace(/\.(NS|BO)$/i, '').toUpperCase();

    try {
        // 1. Primary: Symbol collection
        const docs = await Symbol.find(
            { active: true, assetType: { $in: assetTypes }, exchange: { $in: exchanges } },
            { symbol: 1, _id: 0 }
        ).lean();

        if (docs.length > 0) {
            const symbols = docs.map(d => stripSuffix(d.symbol));
            logger.debug(`symbolRegistry: ${symbols.length} symbols from Symbol collection`);
            return withSuffix ? symbols.map(s => `${s}.NS`) : symbols;
        }

        // 2. Fallback: OHLC distinct symbols
        const ohlcSymbols = await OHLC.distinct('symbol', { exchange: { $in: exchanges } });
        if (ohlcSymbols.length > 0) {
            const symbols = ohlcSymbols.map(stripSuffix);
            logger.debug(`symbolRegistry: ${symbols.length} symbols from OHLC collection`);
            return withSuffix ? symbols.map(s => `${s}.NS`) : symbols;
        }

        // 3. Last resort: seed list
        logger.warn('symbolRegistry: DB empty — using seed list');
        return withSuffix ? SEED_SYMBOLS_NS : SEED_SYMBOLS;
    } catch (err) {
        logger.error(`symbolRegistry error: ${err.message}`);
        return withSuffix ? SEED_SYMBOLS_NS : SEED_SYMBOLS;
    }
};

/**
 * Same as getActiveSymbols but with .NS suffix (Yahoo Finance format).
 */
const getActiveSymbolsWithSuffix = (opts = {}) =>
    getActiveSymbols({ ...opts, withSuffix: true });

/**
 * Fetch recently-seen symbols from OHLC (last N days).
 * Useful for "last seen" dynamic refresh lists.
 */
const getRecentlySeenSymbols = async (days = 7, limit = 100) => {
    const { OHLC } = getModels();
    try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const results = await OHLC.aggregate([
            { $match: { updatedAt: { $gte: since } } },
            { $group: { _id: '$symbol', lastSeen: { $max: '$updatedAt' } } },
            { $sort: { lastSeen: -1 } },
            { $limit: limit },
            { $project: { symbol: '$_id', _id: 0 } },
        ]);

        if (results.length > 0) {
            return results.map(r => String(r.symbol || '').replace(/\.(NS|BO)$/i, '').toUpperCase());
        }

        return getActiveSymbols();
    } catch (err) {
        logger.error(`symbolRegistry.getRecentlySeenSymbols error: ${err.message}`);
        return SEED_SYMBOLS;
    }
};

module.exports = { getActiveSymbols, getActiveSymbolsWithSuffix, getRecentlySeenSymbols, SEED_SYMBOLS };
