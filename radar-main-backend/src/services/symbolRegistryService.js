const axios = require('axios');
const SymbolModel = require('../models/Symbol');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();


const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const DEFAULT_FALLBACK_SYMBOLS = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'WIPRO.NS', name: 'Wipro Limited', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'TATASTEEL.NS', name: 'Tata Steel Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'JIOFIN.NS', name: 'Jio Financial Services Ltd', exchange: 'NSE', country: 'IN', assetType: 'equity', currency: 'INR' },
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', assetType: 'equity', currency: 'USD' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'US', assetType: 'equity', currency: 'USD' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'US', assetType: 'equity', currency: 'USD' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', country: 'US', assetType: 'equity', currency: 'USD' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'US', assetType: 'equity', currency: 'USD' },
    { symbol: 'BTC', name: 'Bitcoin', exchange: 'CRYPTO', country: 'GLOBAL', assetType: 'crypto', currency: 'USD' },
    { symbol: 'ETH', name: 'Ethereum', exchange: 'CRYPTO', country: 'GLOBAL', assetType: 'crypto', currency: 'USD' },
    { symbol: 'SOL', name: 'Solana', exchange: 'CRYPTO', country: 'GLOBAL', assetType: 'crypto', currency: 'USD' },
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', exchange: 'FX', country: 'GLOBAL', assetType: 'forex', currency: 'USD' },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', exchange: 'FX', country: 'GLOBAL', assetType: 'forex', currency: 'USD' },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', exchange: 'FX', country: 'GLOBAL', assetType: 'forex', currency: 'JPY' },
    { symbol: 'NIFTY', name: 'NIFTY 50', exchange: 'NSE', country: 'IN', assetType: 'index', currency: 'INR' },
    { symbol: 'SENSEX', name: 'BSE SENSEX', exchange: 'BSE', country: 'IN', assetType: 'index', currency: 'INR' },
    { symbol: 'SPX', name: 'S&P 500', exchange: 'INDEX', country: 'US', assetType: 'index', currency: 'USD' },
];

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePolygonAssetType = (type) => {
    const value = String(type || '').toLowerCase();
    if (value === 'cs') return 'equity';
    if (value === 'etf') return 'etf';
    if (value === 'index') return 'index';
    if (value === 'fund') return 'fund';
    return 'other';
};

const mapPolygonTicker = (row) => ({
    symbol: String(row.ticker || '').toUpperCase(),
    name: row.name || row.ticker,
    exchange: String(row.primary_exchange || row.exchange || 'US').toUpperCase(),
    country: String(row.locale || 'US').toUpperCase(),
    sector: row.sic_description || null,
    industry: null,
    currency: String(row.currency_name || row.currency_symbol || 'USD').toUpperCase(),
    assetType: normalizePolygonAssetType(row.type),
    provider: 'polygon',
    active: row.active !== false,
});

const fetchPolygonTickers = async ({ maxPages = 5, pageLimit = 1000 } = {}) => {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
        return [];
    }

    const rows = [];
    let cursor = null;

    for (let page = 0; page < maxPages; page += 1) {
        const params = {
            apiKey,
            market: 'stocks',
            active: true,
            limit: pageLimit,
            sort: 'ticker',
            order: 'asc',
        };

        if (cursor) {
            params.cursor = cursor;
        }

        const response = await axios.get('https://api.polygon.io/v3/reference/tickers', {
            params,
            timeout: 9000,
        });

        const resultRows = Array.isArray(response.data?.results) ? response.data.results : [];
        if (!resultRows.length) {
            break;
        }

        rows.push(...resultRows.map(mapPolygonTicker).filter((item) => item.symbol));
        cursor = response.data?.next_url
            ? new URL(response.data.next_url).searchParams.get('cursor')
            : null;

        if (!cursor) {
            break;
        }
    }

    return rows;
};

const fetchSymbolUniverse = async () => {
    const maxPages = Number.parseInt(process.env.SYMBOL_SYNC_MAX_PAGES || '5', 10);

    try {
        const polygonRows = await fetchPolygonTickers({
            maxPages: Number.isFinite(maxPages) && maxPages > 0 ? maxPages : 5,
            pageLimit: 1000,
        });

        if (polygonRows.length > 0) {
            return polygonRows;
        }
    } catch (_error) {
    }

    return DEFAULT_FALLBACK_SYMBOLS.map((item) => ({
        ...item,
        provider: 'internal',
        active: true,
    }));
};

const syncSymbolRegistry = async () => {
    const universe = await fetchSymbolUniverse();

    if (!universe.length) {
        return { synced: 0, source: 'none' };
    }

    const ops = universe.map((item) => ({
        updateOne: {
            filter: { symbol: item.symbol, exchange: item.exchange, assetType: item.assetType },
            update: { $set: item },
            upsert: true,
        },
    }));

    const result = await SymbolModel.bulkWrite(ops, { ordered: false });
    const upserts = Number(result.upsertedCount || 0);
    const modified = Number(result.modifiedCount || 0);

    return {
        synced: upserts + modified,
        totalInput: universe.length,
        source: universe[0]?.provider || 'mixed',
    };
};

const normalizeResult = (row) => ({
    symbol: row.symbol,
    name: row.name,
    exchange: row.exchange,
    country: row.country,
    currency: row.currency,
    type: row.assetType,
    active: row.active,
});

const searchFallbackSymbols = ({ q, type, limit }) => {
    const term = String(q || '').trim().toLowerCase();
    if (!term) return [];

    const rows = DEFAULT_FALLBACK_SYMBOLS
        .filter((item) => {
            if (type && item.assetType !== type) return false;
            return item.symbol.toLowerCase().includes(term) || item.name.toLowerCase().includes(term);
        })
        .slice(0, limit);

    return rows.map((item) => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        country: item.country,
        currency: item.currency,
        type: item.assetType,
        active: true,
    }));
};

const searchYahooFinanceSymbols = async (q, limit) => {
    try {
        const result = await yahooFinance.search(q, { newsCount: 0 });
        const quotes = result?.quotes || [];
        
        return quotes
            .filter(quote => quote.symbol)
            .map(quote => ({
                symbol: quote.symbol,
                name: quote.longname || quote.shortname || quote.symbol,
                exchange: quote.exchDisp || quote.exchange || 'NYSE',
                country: quote.symbol.endsWith('.NS') ? 'IN' : (quote.symbol.endsWith('.BO') ? 'IN' : 'US'),
                currency: quote.symbol.endsWith('.NS') ? 'INR' : (quote.symbol.endsWith('.BO') ? 'INR' : 'USD'),
                type: String(quote.quoteType || quote.typeDisp || 'equity').toLowerCase(),
                active: true,
            }))
            .slice(0, limit);
    } catch (err) {
        console.error('Yahoo Finance Search Error:', err);
        return [];
    }
};

const searchSymbolRegistry = async ({ q, type, limit = DEFAULT_LIMIT } = {}) => {
    const cappedLimit = Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT));
    const term = String(q || '').trim();

    if (!term) {
        return [];
    }

    const regex = new RegExp(`^${escapeRegex(term)}`, 'i');
    const includeRegex = new RegExp(escapeRegex(term), 'i');

    const filter = {
        active: true,
        ...(type ? { assetType: String(type).toLowerCase() } : {}),
        $or: [
            { symbol: regex },
            { name: regex },
            { symbol: includeRegex },
            { name: includeRegex },
        ],
    };

    try {
        const rows = await SymbolModel.find(filter)
            .select('symbol name exchange country currency assetType active')
            .sort({ symbol: 1 })
            .limit(cappedLimit)
            .lean();

        let results = [];
        if (rows.length > 0) {
            results = rows.map(normalizeResult);
        }

        // If we don't have enough database results, search Yahoo Finance as a live fallback
        if (results.length < cappedLimit) {
            const yahooResults = await searchYahooFinanceSymbols(term, cappedLimit - results.length);
            const existingSymbols = new Set(results.map(r => r.symbol.toUpperCase()));
            for (const item of yahooResults) {
                if (!existingSymbols.has(item.symbol.toUpperCase())) {
                    results.push(item);
                }
            }
        }

        if (results.length > 0) {
            return results;
        }
    } catch (_error) {
        console.error("Registry search error:", _error);
    }

    return searchFallbackSymbols({ q: term, type, limit: cappedLimit });
};

module.exports = {
    searchSymbolRegistry,
    syncSymbolRegistry,
};
