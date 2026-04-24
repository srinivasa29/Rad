const { fetchStockData, fetchStockHistory } = require('./stockService');

const PERIOD_TO_HISTORY_INTERVAL = {
    '1d': '1D',
    '1w': '1W',
    '1m': '1M',
    '3m': '3M',
    '6m': '6M',
    '1y': '1Y',
};

const DEFAULT_MARKET_REGION = String(process.env.DEFAULT_MARKET_REGION || 'IN').toUpperCase();

const SECTOR_INDEX_MAP_BY_REGION = {
    IN: {
        'Information Technology': 'NIFTY IT',
        'Financial Services': 'NIFTY FIN SERVICE',
        'Healthcare': 'NIFTY PHARMA',
        'Energy': 'NIFTY ENERGY',
        'Industrials': 'NIFTY CPSE',
        'Consumer Cyclical': 'NIFTY AUTO',
        'Consumer Defensive': 'NIFTY FMCG',
        'Communication Services': 'NIFTY MEDIA',
        'Technology': 'NIFTY IT',
    },
    US: {
        'Technology': 'XLK',
        'Financial Services': 'XLF',
        'Healthcare': 'XLV',
        'Energy': 'XLE',
        'Industrials': 'XLI',
        'Consumer Cyclical': 'XLY',
        'Consumer Defensive': 'XLP',
        'Communication Services': 'XLC',
    },
};

const FALLBACK_SECTORS = [
    { sector: 'Technology', base: 0.9 },
    { sector: 'Financial Services', base: 0.5 },
    { sector: 'Healthcare', base: 0.35 },
    { sector: 'Energy', base: -0.2 },
    { sector: 'Industrials', base: 0.15 },
    { sector: 'Consumer Cyclical', base: 0.25 },
    { sector: 'Communication Services', base: 0.4 },
    { sector: 'Consumer Defensive', base: 0.1 },
];

const resolveSectorIndex = (sector) => {
    const regionMap = SECTOR_INDEX_MAP_BY_REGION[DEFAULT_MARKET_REGION] || SECTOR_INDEX_MAP_BY_REGION.IN;
    return regionMap[sector] || 'Broad Market';
};

const periodScaleFallback = {
    '1d': 1,
    '1w': 1.8,
    '1m': 2.5,
    '3m': 3.8,
    '6m': 5.1,
    '1y': 6.8,
};

const buildFallbackPerformance = (period) => {
    const scale = periodScaleFallback[period.toLowerCase()] ?? periodScaleFallback['1y'];
    return FALLBACK_SECTORS.map((row) => ({
        sector: row.sector,
        index: resolveSectorIndex(row.sector),
        return: Number((row.base * scale).toFixed(2)),
        stockCount: 3,
    }));
};

const computeReturnFromHistory = (history) => {
    if (!Array.isArray(history) || history.length < 2) {
        return null;
    }

    const first = Number(history[0]?.price);
    const last = Number(history[history.length - 1]?.price);
    if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) {
        return null;
    }

    return Number((((last - first) / first) * 100).toFixed(2));
};

const getSectorPerformance = async (period = '1y') => {
    let stocks = [];
    try {
        stocks = await fetchStockData();
    } catch (_error) {
        return buildFallbackPerformance(period).sort((a, b) => b.return - a.return);
    }

    if (!Array.isArray(stocks) || stocks.length === 0) {
        return buildFallbackPerformance(period).sort((a, b) => b.return - a.return);
    }

    const normalizedPeriod = period.toLowerCase();
    const interval = PERIOD_TO_HISTORY_INTERVAL[normalizedPeriod] || '1Y';

    const withReturns = await Promise.all(stocks.map(async (stock) => {
        if (normalizedPeriod === '1d') {
            return {
                ...stock,
                periodReturn: Number.isFinite(Number(stock.change)) ? Number(stock.change) : 0,
            };
        }

        try {
            const history = await fetchStockHistory(stock.symbol, interval);
            const computed = computeReturnFromHistory(history);
            if (computed !== null) {
                return { ...stock, periodReturn: computed };
            }
        } catch (_error) {
        }

        const quoteChange = Number(stock.change);
        const scale = periodScaleFallback[normalizedPeriod] || 1;
        return {
            ...stock,
            periodReturn: Number.isFinite(quoteChange) ? Number((quoteChange * scale).toFixed(2)) : 0,
        };
    }));
    const sectorMap = {};
    for (const stock of withReturns) {
        const sector = stock.details?.sector ?? 'Other';
        if (!sectorMap[sector]) {
            sectorMap[sector] = { total: 0, count: 0 };
        }
        const periodReturn = Number.isFinite(stock.periodReturn) ? stock.periodReturn : 0;
        sectorMap[sector].total += periodReturn;
        sectorMap[sector].count += 1;
    }
    let results = Object.entries(sectorMap)
        .map(([sector, { total, count }]) => ({
            sector,
            index: resolveSectorIndex(sector),
            return: parseFloat((total / count).toFixed(2)),
            stockCount: count
        }))
        .sort((a, b) => b.return - a.return);

    if (results.length < 4) {
        const existing = new Set(results.map((item) => item.sector));
        const fallback = buildFallbackPerformance(period).filter((item) => !existing.has(item.sector));
        results = [...results, ...fallback].slice(0, 8).sort((a, b) => b.return - a.return);
    }

    return results;
};

module.exports = { getSectorPerformance };
