const { fetchStockData } = require('./stockService');

// ── Period → Yahoo Finance API config ──────────────────────────────────────────
// Each config fetches EXACTLY the window needed for that period.
// singleDay=true → use only last 2 candles so (prev_close → today_close) is returned.
const PERIOD_CONFIG = {
    '1d': { range: '5d',   interval: '1d',  singleDay: true  },  // yesterday → today
    '1w': { range: '7d',   interval: '1d',  singleDay: false },  // 5 trading days
    '1m': { range: '1mo',  interval: '1d',  singleDay: false },  // ~22 trading days
    '3m': { range: '3mo',  interval: '1d',  singleDay: false },  // quarter
    '6m': { range: '6mo',  interval: '1wk', singleDay: false },  // half-year (weekly candles)
    '1y': { range: '1y',   interval: '1wk', singleDay: false },  // calendar year (weekly — monthly returns 1pt for CNX)
};

// ── Sector → NIFTY index label ─────────────────────────────────────────────────
// Ordered by priority: first match wins
const SECTOR_TO_INDEX = {
    'Information Technology': 'NIFTY IT',
    'Technology':             'NIFTY IT',
    'Financial Services':     'NIFTY Bank',
    'Banking':                'NIFTY Bank',
    'Healthcare':             'NIFTY Pharma',
    'Pharmaceuticals':        'NIFTY Pharma',
    'Energy':                 'NIFTY Energy',
    'Oil & Gas':              'NIFTY Energy',
    'Industrials':            'NIFTY CPSE',
    'Consumer Cyclical':      'NIFTY Auto',
    'Automobiles':            'NIFTY Auto',
    'Consumer Defensive':     'NIFTY FMCG',
    'FMCG':                   'NIFTY FMCG',
    'Communication Services': 'NIFTY Media',
    'Telecom':                'NIFTY Media',
    'Basic Materials':        'NIFTY Metal',
    'Metals':                 'NIFTY Metal',
    'Utilities':              'NIFTY Infra',
    'Infrastructure':         'NIFTY Infra',
    'Real Estate':            'NIFTY Realty',
    'Services':               'NIFTY Services',
    'MNC':                    'NIFTY MNC',
    'Consumption':            'NIFTY Consumption',
};

// ── NIFTY index label → Yahoo Finance ticker ──────────────────────────────────
// Only tickers verified to return multi-point data from Yahoo Finance.
const INDEX_TO_YAHOO = {
    'NIFTY 50':          '^NSEI',
    'NIFTY IT':          '^CNXIT',
    'NIFTY Bank':        '^NSEBANK',     // ^CNXFIN returns sparse; NSEBANK is reliable
    'NIFTY Pharma':      '^CNXPHARMA',
    'NIFTY Energy':      '^CNXENERGY',
    'NIFTY CPSE':        '^CNXPSE',
    'NIFTY Auto':        '^CNXAUTO',
    'NIFTY FMCG':        '^CNXFMCG',
    'NIFTY Media':       '^CNXMEDIA',
    'NIFTY Metal':       '^CNXMETAL',
    'NIFTY Infra':       '^CNXINFRA',
    'NIFTY Realty':      '^CNXREALTY',
    'NIFTY Services':    '^CNXSERVICE',
    'NIFTY MNC':         '^CNXMNC',
    'NIFTY Consumption': '^CNXCONSUM',
};

// Sectors to exclude from display (no real NIFTY mapping)
const SKIP_SECTORS = new Set(['Unknown', 'Other', 'Currency', 'N/A', '', 'Broad Market']);

// ── Fallback performance values (used if Yahoo fails entirely) ─────────────────
// Based on approximate historical averages; scaled by period.
const FALLBACK_BASE = {
    'Information Technology': 0.9,
    'Financial Services':     0.5,
    'Healthcare':             0.35,
    'Energy':                -0.2,
    'Industrials':            0.15,
    'Consumer Cyclical':      0.25,
    'Communication Services': 0.4,
    'Consumer Defensive':     0.1,
};
const PERIOD_SCALE = { '1d': 1, '1w': 1.8, '1m': 2.5, '3m': 3.8, '6m': 5.1, '1y': 6.8 };

// ── In-memory cache keyed by period ───────────────────────────────────────────
// TTL = 15 minutes so data refreshes after each cron backfill cycle.
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = {};

// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetch closing prices for a NIFTY index from Yahoo Finance.
 * Returns an array of { price } objects, or null on failure.
 */
const fetchIndexPrices = async (indexLabel, period) => {
    const axios = require('axios');
    const yahooTicker = INDEX_TO_YAHOO[indexLabel];
    if (!yahooTicker) return null;

    const config = PERIOD_CONFIG[period] || PERIOD_CONFIG['1y'];

    try {
        const response = await axios.get(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}`,
            {
                params: { range: config.range, interval: config.interval, includePrePost: false },
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
            }
        );

        const result  = response.data?.chart?.result?.[0];
        const closes  = result?.indicators?.quote?.[0]?.close || [];
        const prices  = closes
            .map((c) => Number(c))
            .filter((c) => Number.isFinite(c) && c > 0)
            .map((price) => ({ price }));

        if (prices.length < 2) return null;

        // For 1D: only the last 2 candles give yesterday→today change
        return config.singleDay ? prices.slice(-2) : prices;
    } catch (_err) {
        return null;
    }
};

/**
 * Compute % return from [ { price }, ... ].
 * Formula: (last - first) / first * 100
 */
const computeReturn = (prices) => {
    if (!Array.isArray(prices) || prices.length < 2) return null;
    const first = Number(prices[0]?.price);
    const last  = Number(prices[prices.length - 1]?.price);
    if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) return null;
    return Number((((last - first) / first) * 100).toFixed(2));
};

/**
 * Resolve which NIFTY index label a sector maps to.
 */
const resolveIndex = (sector) => SECTOR_TO_INDEX[sector] || null;

/**
 * Build fallback data when live data is unavailable.
 */
const buildFallback = (period) => {
    const scale = PERIOD_SCALE[period] ?? 1;
    return Object.entries(FALLBACK_BASE).map(([sector, base]) => ({
        sector,
        index:      resolveIndex(sector) || 'NIFTY 50',
        return:     Number((base * scale).toFixed(2)),
        stockCount: 3,
        source:     'fallback',
    }));
};

/**
 * Main export: compute sector performance for a given period.
 *
 * Flow:
 *  1. Check in-memory cache (15 min TTL — refreshes after every backfill cycle)
 *  2. Fetch stock quotes to get sector groupings
 *  3. For each sector, fetch the NIFTY sector index from Yahoo Finance
 *  4. If the index fetch fails, average the individual stock daily changes
 *  5. Sort and return (Best → Worst)
 */
const getSectorPerformance = async (period = '1y') => {
    const p = period.toLowerCase();

    // ── Cache hit ──────────────────────────────────────────────────────────────
    const cached = cache[p];
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
    }

    // ── Fetch stock quotes (for sector grouping + fallback avg-daily) ──────────
    let stocks = [];
    try {
        stocks = await fetchStockData();
    } catch (_e) {
        const fb = buildFallback(p).sort((a, b) => b.return - a.return);
        cache[p] = { data: fb, expiresAt: Date.now() + CACHE_TTL_MS };
        return fb;
    }

    if (!Array.isArray(stocks) || stocks.length === 0) {
        const fb = buildFallback(p).sort((a, b) => b.return - a.return);
        cache[p] = { data: fb, expiresAt: Date.now() + CACHE_TTL_MS };
        return fb;
    }

    // ── Group stocks by sector ─────────────────────────────────────────────────
    const sectorMap = {};
    for (const stock of stocks) {
        const sector = stock.details?.sector ?? stock.sector ?? 'Unknown';
        if (SKIP_SECTORS.has(sector)) continue;
        if (!sectorMap[sector]) {
            sectorMap[sector] = { stocks: [], index: resolveIndex(sector) };
        }
        sectorMap[sector].stocks.push(stock);
    }

    if (Object.keys(sectorMap).length === 0) {
        const fb = buildFallback(p).sort((a, b) => b.return - a.return);
        cache[p] = { data: fb, expiresAt: Date.now() + CACHE_TTL_MS };
        return fb;
    }

    // ── Fetch index return for each sector in parallel ─────────────────────────
    const results = await Promise.all(
        Object.entries(sectorMap).map(async ([sector, { stocks: sectorStocks, index }]) => {
            // Try the NIFTY sector index first (most accurate)
            if (index) {
                const prices      = await fetchIndexPrices(index, p);
                const indexReturn = computeReturn(prices);
                if (indexReturn !== null) {
                    return {
                        sector,
                        index,
                        return:     indexReturn,
                        stockCount: sectorStocks.length,
                        source:     'index',
                    };
                }
            }

            // Fallback: average individual stock daily % changes
            const changes = sectorStocks
                .map((s) => {
                    const raw = Number(s.change ?? s.change_24h ?? NaN);
                    // Guard: reject values that look like absolute price deltas
                    return Number.isFinite(raw) && Math.abs(raw) <= 50 ? raw : null;
                })
                .filter((v) => v !== null);

            if (changes.length === 0) {
                return null;  // skip this sector entirely
            }

            const avgChange   = changes.reduce((s, v) => s + v, 0) / changes.length;
            const scale       = p === '1d' ? 1 : (PERIOD_SCALE[p] || 1);
            const periodRet   = Number((avgChange * scale).toFixed(2));

            return {
                sector,
                index:      index || 'NIFTY 50',
                return:     periodRet,
                stockCount: sectorStocks.length,
                source:     'avg-daily',
            };
        })
    );

    let sorted = results
        .filter(Boolean)
        .sort((a, b) => b.return - a.return);

    // If we got fewer than 4 real sectors, pad with fallback sectors
    if (sorted.length < 4) {
        const existing = new Set(sorted.map((r) => r.sector));
        const pad = buildFallback(p)
            .filter((r) => !existing.has(r.sector))
            .slice(0, 8 - sorted.length);
        sorted = [...sorted, ...pad].sort((a, b) => b.return - a.return);
    }

    // ── Cache result ───────────────────────────────────────────────────────────
    cache[p] = { data: sorted, expiresAt: Date.now() + CACHE_TTL_MS };
    return sorted;
};

/**
 * Invalidate cache for all periods (call this after a backfill completes).
 * The next request to getSectorPerformance will trigger a fresh Yahoo fetch.
 */
const invalidateSectorCache = () => {
    Object.keys(cache).forEach((key) => delete cache[key]);
};

module.exports = { getSectorPerformance, invalidateSectorCache };
