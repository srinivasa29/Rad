/**
 * fundamentalsEnrichmentService.js
 *
 * Fetches real fundamental + technical metadata for a stock symbol using
 * yahoo-finance2's `quoteSummary` module.
 *
 * Fields returned:
 *   pe           – trailing P/E ratio
 *   beta         – 5-year monthly beta vs S&P 500 (Yahoo)
 *   roe          – Return on Equity (%)
 *   deliveryPct  – estimated delivery % (approximated from short ratio)
 *   momentum     – 1-month price return (%)
 *   sector       – GICS sector string
 *   industry     – GICS industry string
 *   marketCap    – raw market cap number
 *   valStatus    – 'undervalued' | 'fair' | 'overvalued' based on PE
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const NodeCache   = require('node-cache');
const logger      = require('../config/logger');

// Cache fundamentals for 6 hours — they rarely change intraday
const cache = new NodeCache({ stdTTL: 6 * 60 * 60, checkperiod: 60 * 30 });

// Known crypto short-codes — these must NEVER get a .NS suffix
const CRYPTO_SYMBOLS = new Set([
    'BTC','ETH','SOL','XRP','BNB','ADA','DOT','DOGE','MATIC','LINK',
    'AVAX','ATOM','LTC','UNI','SHIB','TRX','ETC','FIL','NEAR','APT',
    'ARB','OP','INJ','SUI','SEI','PEPE','WIF','TON','FLOKI','BONK',
]);

function isCryptoSymbol(symbol) {
    const s = String(symbol || '').toUpperCase().replace(/USDT$/i, '').replace(/\.(NS|BO)$/i, '');
    return CRYPTO_SYMBOLS.has(s) || String(symbol).toUpperCase().endsWith('USDT');
}

/**
 * Ensure the symbol has the correct Yahoo Finance suffix for Indian stocks.
 * HDFCBANK → HDFCBANK.NS
 * BTC, ETH, etc. → returned as-is (Yahoo uses BTC-USD, but we skip Yahoo for crypto anyway)
 */
function normalizeSymbol(symbol) {
    const s = String(symbol || '').trim().toUpperCase();
    // Never append .NS to crypto assets
    if (isCryptoSymbol(s)) return s;
    if (s.endsWith('.NS') || s.endsWith('.BO')) return s;
    // Assume NSE for Indian stocks (most common)
    return `${s}.NS`;
}

/**
 * Classify valuation based on trailing PE vs sector norms.
 */
function classifyValuation(pe) {
    if (pe == null || isNaN(pe)) return 'fair';
    if (pe < 15)  return 'undervalued';
    if (pe > 35)  return 'overvalued';
    return 'fair';
}

/**
 * Calculate 1-month momentum from the summary detail's 52-week range.
 * If regularMarketPrice and fiftyDayAverage are available, we use the
 * deviation from 50-day MA as a momentum proxy.
 */
function approximateMomentum(summaryDetail, defaultChange = 0) {
    try {
        const price = summaryDetail?.regularMarketPrice;
        const ma50  = summaryDetail?.fiftyDayAverage;
        if (price && ma50 && ma50 !== 0) {
            return parseFloat(((price - ma50) / ma50 * 100).toFixed(2));
        }
    } catch (_) {}
    return defaultChange;
}

/**
 * Approximate delivery % from short percentage of float.
 * Higher short % → lower implied delivery conviction.
 * This is a proxy; real delivery data requires NSE direct feed.
 */
function approximateDelivery(defaultKeyStatistics) {
    try {
        const shortPct = defaultKeyStatistics?.shortPercentOfFloat;
        if (shortPct != null) {
            // Invert and scale: low short % → high delivery %
            return parseFloat((Math.max(0, (1 - shortPct) * 100)).toFixed(1));
        }
    } catch (_) {}
    return 55; // neutral fallback
}

/**
 * Main enrichment function.
 * @param {string} symbol - Any format: 'HDFCBANK', 'HDFCBANK.NS', etc.
 * @param {number} [changePercent=0] - Current day % change, used as fallback for momentum
 * @returns {Promise<object>} Enriched fundamentals object
 */
async function getFundamentals(symbol, changePercent = 0) {
    const yahooSym = normalizeSymbol(symbol);
    const cacheKey = `fundamentals:${yahooSym}`;

    // Crypto assets have no equity fundamentals — return null-safe object immediately
    if (isCryptoSymbol(symbol)) {
        return {
            pe: null, beta: null, roe: null, debtToEquity: null,
            revenueGrowth: null, profitMargins: null, deliveryPct: null,
            momentum: changePercent, volumeRatio: 1,
            sector: 'Cryptocurrency', industry: 'Digital Assets',
            marketCap: null, valStatus: 'fair',
        };
    }

    // Return cached value if available
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.debug(`[Fundamentals] Cache hit for ${yahooSym}`);
        return cached;
    }

    try {
        logger.info(`[Fundamentals] Fetching from Yahoo Finance for ${yahooSym}`);

        const summary = await yahooFinance.quoteSummary(yahooSym, {
            modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile'],
        });

        const sd  = summary?.summaryDetail        || {};
        const ks  = summary?.defaultKeyStatistics || {};
        const fd  = summary?.financialData        || {};
        const ap  = summary?.assetProfile         || {};

        const pe           = sd.trailingPE ?? ks.trailingPE ?? null;
        const beta         = sd.beta ?? null;
        const roe          = fd.returnOnEquity != null ? parseFloat((fd.returnOnEquity * 100).toFixed(2)) : null;
        const debtToEquity = fd.debtToEquity != null ? parseFloat((fd.debtToEquity / 100).toFixed(2)) : null;
        const revenueGrowth = fd.revenueGrowth != null ? parseFloat((fd.revenueGrowth * 100).toFixed(2)) : null;
        const profitMargins = fd.profitMargins != null ? parseFloat((fd.profitMargins * 100).toFixed(2)) : null;
        const deliveryPct  = approximateDelivery(ks);
        const momentum     = approximateMomentum(sd, changePercent);
        const sector       = ap.sector   || 'Equity';
        const industry     = ap.industry || '';
        const marketCap    = sd.marketCap ?? ks.marketCap ?? null;
        const volumeRatio  = sd.averageVolume10days > 0 && sd.averageVolume > 0
            ? parseFloat((sd.averageVolume10days / sd.averageVolume).toFixed(2))
            : 1;

        const result = {
            pe:          pe   != null ? parseFloat(pe.toFixed(1))   : null,
            beta:        beta != null ? parseFloat(beta.toFixed(2))  : null,
            roe:         roe,
            debtToEquity,
            revenueGrowth,
            profitMargins,
            deliveryPct,
            momentum,
            volumeRatio,
            sector,
            industry,
            marketCap,
            valStatus:   classifyValuation(pe),
        };

        cache.set(cacheKey, result);
        logger.info(`[Fundamentals] ✅ Enriched ${yahooSym}: PE=${result.pe}, Beta=${result.beta}, ROE=${result.roe}%`);
        return result;

    } catch (err) {
        logger.warn(`[Fundamentals] Failed for ${yahooSym}: ${err.message}`);
        // Return safe nulls — frontend handles these gracefully
        return {
            pe:          null,
            beta:        null,
            roe:         null,
            debtToEquity: null,
            revenueGrowth: null,
            profitMargins: null,
            deliveryPct: null,
            momentum:    changePercent,
            volumeRatio: 1,
            sector:      isCryptoSymbol(symbol) ? 'Cryptocurrency' : 'Equity',
            industry:    isCryptoSymbol(symbol) ? 'Digital Assets' : '',
            marketCap:   null,
            valStatus:   'fair',
        };
    }
}

/**
 * Batch enrichment — runs in parallel with a small concurrency cap.
 * @param {Array<{symbol: string, changePercent?: number}>} items
 * @returns {Promise<Map<string, object>>} symbol → fundamentals
 */
async function getBatchFundamentals(items, concurrency = 3) {
    const results = new Map();
    const queue = [...items];

    async function worker() {
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) break;
            const sym = item.symbol || item;
            const chg = item.changePercent || 0;
            results.set(sym, await getFundamentals(sym, chg));
        }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
}

module.exports = { getFundamentals, getBatchFundamentals, normalizeSymbol };
