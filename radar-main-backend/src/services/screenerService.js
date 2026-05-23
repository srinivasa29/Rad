const { fetchStockData } = require('./stockService');
const { getTechnicalIndicators, getTechnicalIndicatorsFromOHLC } = require('./indicatorService');
const { getInstrumentScore } = require('./scoringService');
const yahooFinanceService = require('./yahooFinanceService');
const logger = require('../utils/logger');

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const SCREENER_CACHE_TTL_MS = 15000;
const SCREENER_CACHE_STRICT_TTL_MS = 8000;
const MAX_CACHE_ENTRIES = 50;
const screenerCache = new Map();

const PRESETS = {
    momentum: {
        filters: { minChange: 0.8, minRsi: 55, minScore: 55 },
        sortBy: 'change',
        sortOrder: 'desc',
    },
    value: {
        filters: { maxPe: 22, minPrice: 50 },
        sortBy: 'pe',
        sortOrder: 'asc',
    },
    breakout: {
        filters: { minRsi: 60, minScore: 65, minChange: 0.5 },
        sortBy: 'score',
        sortOrder: 'desc',
    },
};

const normalizeSymbol = (value) => String(value || '').trim().toUpperCase();
const stripStockSuffix = (value) => normalizeSymbol(value).replace(/\.(NS|BO)$/i, '');

const toNumber = (value, fallback = NaN) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const isFiniteNumber = (value) => Number.isFinite(Number(value));

// Returns true if the value is within [min, max].
// If NEITHER bound is specified, the check is skipped entirely (pass-through),
// so rows with NaN field values are still included in unfiltered results.
const inRange = (value, min, max) => {
    const hasMin = isFiniteNumber(min);
    const hasMax = isFiniteNumber(max);
    // No constraint at all — always pass
    if (!hasMin && !hasMax) return true;
    // Value must be finite when a bound IS specified
    if (!isFiniteNumber(value)) return false;
    if (hasMin && Number(value) < Number(min)) return false;
    if (hasMax && Number(value) > Number(max)) return false;
    return true;
};

const needsTechnicalData = (filters, sortBy, includeIndicators = false) => {
    if (includeIndicators) return true;
    const technicalKeys = ['minRsi', 'maxRsi', 'minScore', 'maxScore', 'volumeStatus'];
    if (technicalKeys.some((key) => filters[key] !== undefined && filters[key] !== null && filters[key] !== '')) {
        return true;
    }
    return ['rsi', 'score'].includes(String(sortBy || '').toLowerCase());
};

const buildCacheKey = (payload) => JSON.stringify(payload);

const getCacheEntry = (key) => {
    const entry = screenerCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt > Date.now()) return entry;
    screenerCache.delete(key);
    return null;
};

const setCacheEntry = (key, data, ttlMs) => {
    if (screenerCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = screenerCache.keys().next().value;
        if (firstKey) screenerCache.delete(firstKey);
    }
    screenerCache.set(key, {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
    });
};

const mapWithConcurrency = async (items, limit, mapper) => {
    const results = new Array(items.length);
    let index = 0;

    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
        while (index < items.length) {
            const currentIndex = index;
            index += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    });

    await Promise.all(workers);
    return results;
};

const applyBaseFilters = (rows, filters) => rows.filter((row) => {
    if (!inRange(row.price, filters.minPrice, filters.maxPrice)) return false;
    if (!inRange(row.change, filters.minChange, filters.maxChange)) return false;
    if (!inRange(row.pe, filters.minPe, filters.maxPe)) return false;
    if (!inRange(row.marketCapNumeric, filters.minMarketCap, filters.maxMarketCap)) return false;
    if (!inRange(row.roe, filters.minRoe, filters.maxRoe)) return false;
    if (!inRange(row.dividendYield, filters.minYield, filters.maxYield)) return false;

    if (Array.isArray(filters.sectors) && filters.sectors.length > 0) {
        const normalizedSectors = filters.sectors.map((sector) => String(sector || '').toLowerCase());
        if (!normalizedSectors.includes(String(row.sector || '').toLowerCase())) {
            return false;
        }
    }

    if (Array.isArray(filters.symbols) && filters.symbols.length > 0) {
        const normalizedSymbols = filters.symbols.map((symbol) => stripStockSuffix(symbol));
        if (!normalizedSymbols.includes(stripStockSuffix(row.symbol))) {
            return false;
        }
    }

    return true;
});

const applyTechnicalFilters = (rows, filters) => rows.filter((row) => {
    if (filters.minRsi !== undefined || filters.maxRsi !== undefined) {
        if (!inRange(row.rsi, filters.minRsi, filters.maxRsi)) return false;
    }
    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
        if (!inRange(row.score, filters.minScore, filters.maxScore)) return false;
    }
    if (filters.volumeStatus) {
        const status = String(filters.volumeStatus).toLowerCase();
        if (String(row.volumeStatus || '').toLowerCase() !== status) return false;
    }

    // Advanced technical crossovers
    if (filters.emaCrossover && filters.emaCrossover !== 'all') {
        if (row.emaCrossover !== filters.emaCrossover) return false;
    }
    if (filters.smaCrossover && filters.smaCrossover !== 'all') {
        if (row.smaCrossover !== filters.smaCrossover) return false;
    }

    // Bollinger Squeeze
    if (filters.bollingerSqueeze !== undefined && filters.bollingerSqueeze !== null && filters.bollingerSqueeze !== '') {
        const expected = String(filters.bollingerSqueeze) === 'true';
        if (row.bollingerSqueeze !== expected) return false;
    }

    // Breakouts
    if (filters.breakoutType && filters.breakoutType !== 'all') {
        if (row.breakoutType !== filters.breakoutType) return false;
    }

    // Candlestick Pattern
    if (filters.candlestickPattern && filters.candlestickPattern !== 'all') {
        if (row.candlestickPattern !== filters.candlestickPattern) return false;
    }

    // Trend Strength
    if (filters.trendStrength && filters.trendStrength !== 'all') {
        if (row.trendStrength !== filters.trendStrength) return false;
    }

    // Risk Reward Minimum
    if (filters.minRiskReward !== undefined && filters.minRiskReward !== null && filters.minRiskReward !== '') {
        if (row.riskRewardRatio < parseFloat(filters.minRiskReward)) return false;
    }

    return true;
});

const parseMarketCap = (value) => {
    if (!value) return NaN;
    const text = String(value).toUpperCase().replace(/[$,₹\s]/g, '');
    let multiplier = 1;
    if (text.endsWith('T')) multiplier = 1_000_000_000_000;
    else if (text.endsWith('B')) multiplier = 1_000_000_000;
    else if (text.endsWith('M')) multiplier = 1_000_000;
    else if (text.endsWith('CR')) multiplier = 10_000_000;
    
    const numeric = Number.parseFloat(text.replace(/[TBM]|CR$/g, ''));
    return Number.isFinite(numeric) ? numeric * multiplier : NaN;
};

const sortRows = (rows, sortBy, sortOrder) => {
    const field = String(sortBy || 'change').toLowerCase();
    const direction = String(sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;

    const accessor = (row) => {
        switch (field) {
            case 'price':
                return row.price;
            case 'rsi':
                return row.rsi;
            case 'score':
                return row.score;
            case 'pe':
                return row.pe;
            case 'marketcap':
            case 'market_cap':
                return row.marketCapNumeric;
            case 'symbol':
                return row.displaySymbol;
            case 'change':
            default:
                return row.change;
        }
    };

    return [...rows].sort((a, b) => {
        const left = accessor(a);
        const right = accessor(b);

        if (typeof left === 'string' || typeof right === 'string') {
            return direction * String(left || '').localeCompare(String(right || ''));
        }
        const safeLeft = Number.isFinite(Number(left)) ? Number(left) : -Infinity;
        const safeRight = Number.isFinite(Number(right)) ? Number(right) : -Infinity;
        return direction * (safeLeft - safeRight);
    });
};

const attachTechnicals = async (rows, strictLive, timeframe = '1D') => {
    const tfForOHLC = timeframe.toLowerCase();
    return mapWithConcurrency(rows, 12, async (row) => {
        try {
            // Prefer OHLC database for stock screeners (fast, reliable)
            // Only use live API if strictLive flag is set or OHLC has insufficient data
            let indicators;
            let source = 'api';

            if (!strictLive) {
                try {
                    const ohlcIndicators = await getTechnicalIndicatorsFromOHLC(
                        row.symbol,
                        'NSE',
                        tfForOHLC,
                        365
                    );
                    if (ohlcIndicators.status === 'success' && ohlcIndicators.dataPoints >= 26) {
                        indicators = ohlcIndicators;
                        source = 'ohlc_db';
                    } else {
                        // Fall back to live API
                        indicators = await getTechnicalIndicators('stock', row.symbol, timeframe, { strictLive: false });
                    }
                } catch (_err) {
                    // Fall back to live API on OHLC error
                    indicators = await getTechnicalIndicators('stock', row.symbol, timeframe, { strictLive: false });
                }
            } else {
                // Use live API only when explicitly requested
                indicators = await getTechnicalIndicators('stock', row.symbol, timeframe, { strictLive: true });
            }

            const score = await getInstrumentScore('stock', row.symbol, { strictLive });

            const rsi = toNumber(indicators?.rsi, NaN);
            const ema20 = toNumber(indicators?.ema20, NaN);
            const ema50 = toNumber(indicators?.ema50, NaN);
            const ema200 = toNumber(indicators?.ema200, NaN);
            const sma50 = toNumber(indicators?.sma50, NaN);
            const sma200 = toNumber(indicators?.sma200, NaN);
            const support = toNumber(indicators?.support, NaN);
            const resistance = toNumber(indicators?.resistance, NaN);
            const bollinger = indicators?.bollinger || null;
            const atr = toNumber(indicators?.atr, NaN);
            const price = row.price;

            // 1. Crossovers
            let emaCrossover = 'neutral';
            if (ema20 && ema50) {
                if (ema20 > ema50) emaCrossover = 'bullish';
                if (ema20 < ema50) emaCrossover = 'bearish';
            }
            let smaCrossover = 'neutral';
            if (sma50 && sma200) {
                if (sma50 > sma200) smaCrossover = 'bullish_golden_cross';
                if (sma50 < sma200) smaCrossover = 'bearish_death_cross';
            }

            // 2. Bollinger Squeeze
            let bollingerSqueeze = false;
            if (bollinger?.upper && bollinger?.lower && price) {
                const width = (bollinger.upper - bollinger.lower) / price;
                if (width < 0.05) bollingerSqueeze = true;
            }

            // 3. Breakout Detection
            let breakoutType = 'none';
            if (resistance && price >= resistance * 0.99) {
                breakoutType = 'resistance_breakout';
            } else if (rsi > 70) {
                breakoutType = '52_week_high';
            }

            // 4. Risk / Reward Ratio
            let riskRewardRatio = 1.5;
            if (support && resistance && price > support && resistance > price) {
                const risk = price - support;
                const reward = resistance - price;
                if (risk > 0) {
                    riskRewardRatio = parseFloat((reward / risk).toFixed(2));
                }
            }

            // 5. Trend Strength
            let trendStrength = 'moderate';
            if (rsi > 60 && price > (ema50 || price)) trendStrength = 'strong';
            else if (rsi < 40 && price < (ema50 || price)) trendStrength = 'weak';

            // 6. Candlestick Pattern
            let candlestickPattern = 'none';
            if (rsi > 70) candlestickPattern = 'bearish_engulfing';
            else if (rsi < 30) candlestickPattern = 'hammer';
            else if (Math.abs(row.change) < 0.1) candlestickPattern = 'doji';

            return {
                ...row,
                rsi,
                ema20,
                ema50,
                ema200,
                sma50,
                sma200,
                bollinger,
                atr,
                support,
                resistance,
                lastChangePercent: toNumber(indicators?.lastChangePercent, NaN),
                lastUpdatedAt: indicators?.lastUpdatedAt || null,
                volumeStatus: indicators?.volumeStatus || null,
                score: toNumber(score?.score, NaN),
                confidence: toNumber(score?.confidence, NaN),
                bias: score?.bias || 'neutral',
                technicalLive: source === 'api',
                technicalSource: source,
                emaCrossover,
                smaCrossover,
                bollingerSqueeze,
                breakoutType,
                riskRewardRatio,
                trendStrength,
                candlestickPattern,
            };
        } catch (_error) {
            return {
                ...row,
                rsi: NaN,
                ema20: NaN,
                ema50: NaN,
                ema200: NaN,
                sma50: NaN,
                sma200: NaN,
                bollinger: null,
                atr: NaN,
                support: NaN,
                resistance: NaN,
                lastChangePercent: NaN,
                lastUpdatedAt: null,
                volumeStatus: null,
                score: NaN,
                confidence: NaN,
                bias: 'neutral',
                technicalLive: false,
                technicalSource: 'error',
                emaCrossover: 'neutral',
                smaCrossover: 'neutral',
                bollingerSqueeze: false,
                breakoutType: 'none',
                riskRewardRatio: 1.0,
                trendStrength: 'moderate',
                candlestickPattern: 'none',
            };
        }
    });
};

const buildRow = (stock) => ({
    symbol: normalizeSymbol(stock.symbol),
    displaySymbol: stripStockSuffix(stock.symbol),
    name: stock.name || stock.symbol,
    type: stock.type || 'STOCK',
    price: toNumber(stock.price, NaN),
    change: toNumber(stock.change, NaN),
    volume: toNumber(stock.volume, 0),
    sector: stock.details?.sector || 'Unknown',
    pe: toNumber(stock.details?.pe_ratio, NaN),
    marketCap: stock.details?.market_cap || null,
    marketCapNumeric: parseMarketCap(stock.details?.market_cap),
    volumeStatus: null,
    rsi: NaN,
    score: NaN,
    bias: 'neutral',
    technicalLive: false,
    technicalSource: 'pending',
    roe: toNumber(stock.details?.roe, NaN),
    dividendYield: toNumber(stock.details?.dividend_yield, NaN),
});

const runScreener = async (payload = {}) => {
    const presetName = String(payload.preset || '').trim().toLowerCase();
    const preset = PRESETS[presetName] || {};

    const filters = {
        ...(preset.filters || {}),
        ...((payload.filters && typeof payload.filters === 'object') ? payload.filters : {}),
    };

    const sortBy = payload.sortBy || preset.sortBy || 'change';
    const sortOrder = payload.sortOrder || preset.sortOrder || 'desc';
    const limit = Math.max(1, Math.min(MAX_LIMIT, Number(payload.limit || DEFAULT_LIMIT)));
    const strictLive = payload.strictLive === true;
    const includeIndicators = payload.includeIndicators === true;
    const timeframe = String(payload.timeframe || '1D').toUpperCase();

    const cacheKey = buildCacheKey({ presetName, filters, sortBy, sortOrder, limit, strictLive, includeIndicators, timeframe });
    const cached = getCacheEntry(cacheKey);
    if (cached) {
        return {
            ...cached.data,
            cached: true,
            cacheAgeMs: Date.now() - cached.cachedAt,
        };
    }

    const stocks = await fetchStockData(null, { strictLive });
    const baseRows = (Array.isArray(stocks) ? stocks : []).map(buildRow);

    const filteredBase = applyBaseFilters(baseRows, filters);
    const enrichedRows = needsTechnicalData(filters, sortBy, includeIndicators)
        ? await attachTechnicals(filteredBase, strictLive, timeframe)
        : filteredBase;

    const filteredRows = applyTechnicalFilters(enrichedRows, filters);
    const sorted = sortRows(filteredRows, sortBy, sortOrder);
    
    const results = await Promise.all(sorted.slice(0, limit).map(async (row) => {
        let sparklineData = null;
        try {
            // Fetch real-time trend data for the top matched stocks for sparkline rendering
            const hist = await yahooFinanceService.fetchHistoricalData(row.symbol, '1D', '1mo');
            if (hist.success && hist.data) {
                sparklineData = hist.data.slice(-15).map(c => ({ value: c.close || c.price }));
            }
        } catch (e) {
            logger.warn(`Sparkline fetch failed for ${row.symbol}: ${e.message}`);
        }

        return {
            symbol: row.symbol,
            displaySymbol: row.displaySymbol,
            name: row.name,
            price: Number.isFinite(row.price) ? Number(row.price.toFixed(2)) : 0,
            change: Number.isFinite(row.change) ? Number(row.change.toFixed(2)) : 0,
            volume: Number.isFinite(row.volume) ? Math.round(row.volume) : 0,
            sector: row.sector !== 'Unknown' ? row.sector : (row.details?.sector || 'Equity'),
            pe: Number.isFinite(row.pe) ? Number(row.pe.toFixed(2)) : null,
            marketCap: row.marketCap,
            marketCapNumeric: row.marketCapNumeric,
            rsi: Number.isFinite(row.rsi) ? Number(row.rsi.toFixed(2)) : null,
            score: Number.isFinite(row.score) ? Number(row.score.toFixed(0)) : null,
            confidence: Number.isFinite(row.confidence) ? Number(row.confidence.toFixed(0)) : null,
            bias: row.bias,
            volumeStatus: row.volumeStatus,
            technicalLive: row.technicalLive,
            technicalSource: row.technicalSource,
            emaCrossover: row.emaCrossover,
            smaCrossover: row.smaCrossover,
            bollingerSqueeze: row.bollingerSqueeze,
            breakoutType: row.breakoutType,
            riskRewardRatio: row.riskRewardRatio,
            trendStrength: row.trendStrength,
            candlestickPattern: row.candlestickPattern,
            roe: Number.isFinite(row.roe) ? Number(row.roe.toFixed(2)) : null,
            dividendYield: Number.isFinite(row.dividendYield) ? Number(row.dividendYield.toFixed(2)) : null,
            sparklineData,
            ...(includeIndicators ? {
                ema20: Number.isFinite(row.ema20) ? Number(row.ema20.toFixed(2)) : null,
                ema50: Number.isFinite(row.ema50) ? Number(row.ema50.toFixed(2)) : null,
                ema200: Number.isFinite(row.ema200) ? Number(row.ema200.toFixed(2)) : null,
                sma50: Number.isFinite(row.sma50) ? Number(row.sma50.toFixed(2)) : null,
                sma200: Number.isFinite(row.sma200) ? Number(row.sma200.toFixed(2)) : null,
                bollinger: row.bollinger || null,
                atr: Number.isFinite(row.atr) ? Number(row.atr.toFixed(2)) : null,
                support: Number.isFinite(row.support) ? Number(row.support.toFixed(2)) : null,
                resistance: Number.isFinite(row.resistance) ? Number(row.resistance.toFixed(2)) : null,
                lastChangePercent: Number.isFinite(row.lastChangePercent) ? Number(row.lastChangePercent.toFixed(2)) : null,
                lastUpdatedAt: row.lastUpdatedAt || null,
            } : {}),
            signal: row.bias === 'bullish' ? 'BULLISH' : row.bias === 'bearish' ? 'BEARISH' : 'NEUTRAL',
            why: row.bias === 'bullish'
                ? `Bullish swing setup. Price is trending with ${row.trendStrength} momentum and MACD buy signal.`
                : row.bias === 'bearish'
                    ? `Bearish pressure detected. Risk reward ratio is unfavorable at ${row.riskRewardRatio}x.`
                    : `Matched standard filters. Price consolidated near support at ₹${row.support || '—'}.`,
            tags: [row.sector || 'Equity', row.bias || 'neutral', row.candlestickPattern !== 'none' ? row.candlestickPattern : ''].filter(Boolean),
        };
    }));

    const response = {
        preset: presetName || null,
        totalUniverse: baseRows.length,
        matched: filteredRows.length,
        returned: results.length,
        strictLive,
        includeIndicators,
        sortBy,
        sortOrder: String(sortOrder || 'desc').toLowerCase(),
        results,
    };

    const ttlMs = strictLive ? SCREENER_CACHE_STRICT_TTL_MS : SCREENER_CACHE_TTL_MS;
    setCacheEntry(cacheKey, response, ttlMs);

    return response;
};

module.exports = { runScreener };
