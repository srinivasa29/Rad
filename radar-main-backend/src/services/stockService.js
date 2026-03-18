const axios = require('axios');
const { generateHistory } = require('../utils/mockGenerator');
const logger = require('../utils/logger');

const QUOTE_CACHE_TTL_MS = Number.parseInt(process.env.STOCK_QUOTES_CACHE_TTL_MS || '20000', 10);
const PROVIDER_FAILURE_COOLDOWN_MS = Number.parseInt(process.env.STOCK_PROVIDER_FAILURE_COOLDOWN_MS || '180000', 10);

const DEFAULT_MARKET_REGION = String(process.env.DEFAULT_MARKET_REGION || 'IN').toUpperCase();
const DEFAULT_STOCK_SYMBOLS_BY_REGION = {
    IN: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'LT.NS', 'ITC.NS', 'HINDUNILVR.NS', 'KOTAKBANK.NS', 'BHARTIARTL.NS', 'BAJFINANCE.NS'],
    US: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 'XOM', 'UNH', 'WMT', 'BA'],
    GLOBAL: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'JPM', 'XOM', 'WMT'],
};

const getDefaultSymbols = () => {
    return DEFAULT_STOCK_SYMBOLS_BY_REGION[DEFAULT_MARKET_REGION] || DEFAULT_STOCK_SYMBOLS_BY_REGION.IN;
};

let quotesCache = {
    expiresAt: 0,
    data: null,
};

let quotesInFlightPromise = null;

const providerState = {
    yahoo: { blockedUntil: 0, lastError: null },
    polygon: { blockedUntil: 0, lastError: null },
    stooq: { blockedUntil: 0, lastError: null },
};

const isProviderBlocked = (name) => Date.now() < (providerState[name]?.blockedUntil || 0);

const markProviderFailure = (name, errorMessage) => {
    if (!providerState[name]) return;
    providerState[name].blockedUntil = Date.now() + PROVIDER_FAILURE_COOLDOWN_MS;
    providerState[name].lastError = errorMessage;
};

const clearProviderFailure = (name) => {
    if (!providerState[name]) return;
    providerState[name].blockedUntil = 0;
    providerState[name].lastError = null;
};

const parseStockSymbols = () => {
    const defaultSymbols = getDefaultSymbols();
    const fromEnv = process.env.STOCK_SYMBOLS;
    if (!fromEnv) {
        return defaultSymbols;
    }

    const parsed = fromEnv
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);

    if (!parsed.length) {
        return defaultSymbols;
    }

    const merged = [...parsed];
    for (const symbol of defaultSymbols) {
        if (!merged.includes(symbol)) {
            merged.push(symbol);
        }
        if (merged.length >= 12) {
            break;
        }
    }

    return merged;
};

const fallbackStockMeta = {
    'RELIANCE.NS': { name: 'Reliance Industries Ltd', sector: 'Energy', peRatio: 24.1, dividendYield: 0.34 },
    'TCS.NS': { name: 'Tata Consultancy Services Ltd', sector: 'Information Technology', peRatio: 30.6, dividendYield: 1.17 },
    'HDFCBANK.NS': { name: 'HDFC Bank Ltd', sector: 'Financial Services', peRatio: 18.9, dividendYield: 0.97 },
    'INFY.NS': { name: 'Infosys Ltd', sector: 'Information Technology', peRatio: 26.4, dividendYield: 2.11 },
    'ICICIBANK.NS': { name: 'ICICI Bank Ltd', sector: 'Financial Services', peRatio: 20.2, dividendYield: 0.72 },
    'SBIN.NS': { name: 'State Bank of India', sector: 'Financial Services', peRatio: 11.8, dividendYield: 1.62 },
    'LT.NS': { name: 'Larsen & Toubro Ltd', sector: 'Industrials', peRatio: 33.1, dividendYield: 0.91 },
    'ITC.NS': { name: 'ITC Ltd', sector: 'Consumer Defensive', peRatio: 28.3, dividendYield: 3.41 },
    'HINDUNILVR.NS': { name: 'Hindustan Unilever Ltd', sector: 'Consumer Defensive', peRatio: 56.7, dividendYield: 1.58 },
    'KOTAKBANK.NS': { name: 'Kotak Mahindra Bank Ltd', sector: 'Financial Services', peRatio: 22.8, dividendYield: 0.09 },
    'BHARTIARTL.NS': { name: 'Bharti Airtel Ltd', sector: 'Communication Services', peRatio: 64.4, dividendYield: 0.23 },
    'BAJFINANCE.NS': { name: 'Bajaj Finance Ltd', sector: 'Financial Services', peRatio: 35.7, dividendYield: 0.34 },
    AAPL: { name: 'Apple Inc.', sector: 'Technology', peRatio: 29.4, dividendYield: 0.52 },
    MSFT: { name: 'Microsoft Corporation', sector: 'Technology', peRatio: 36.1, dividendYield: 0.74 },
    GOOGL: { name: 'Alphabet Inc.', sector: 'Communication Services', peRatio: 24.3, dividendYield: 0.42 },
    AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', peRatio: 52.8, dividendYield: 0 },
    META: { name: 'Meta Platforms Inc.', sector: 'Communication Services', peRatio: 28.9, dividendYield: 0.41 },
    NVDA: { name: 'NVIDIA Corporation', sector: 'Semiconductors', peRatio: 64.2, dividendYield: 0.03 },
    TSLA: { name: 'Tesla Inc.', sector: 'Automotive', peRatio: 62.5, dividendYield: 0 },
    JPM: { name: 'JPMorgan Chase & Co.', sector: 'Financial Services', peRatio: 13.7, dividendYield: 2.32 },
    XOM: { name: 'Exxon Mobil Corporation', sector: 'Energy', peRatio: 12.3, dividendYield: 3.41 },
    UNH: { name: 'UnitedHealth Group Incorporated', sector: 'Healthcare', peRatio: 21.1, dividendYield: 1.57 },
    WMT: { name: 'Walmart Inc.', sector: 'Consumer Defensive', peRatio: 31.8, dividendYield: 1.31 },
    BA: { name: 'The Boeing Company', sector: 'Industrials', peRatio: null, dividendYield: 0 },
};

const fallbackPriceMap = {
    'RELIANCE.NS': 2968.5,
    'TCS.NS': 4098.2,
    'HDFCBANK.NS': 1638.6,
    'INFY.NS': 1672.9,
    'ICICIBANK.NS': 1124.4,
    'SBIN.NS': 825.1,
    'LT.NS': 3712.8,
    'ITC.NS': 427.3,
    'HINDUNILVR.NS': 2479.5,
    'KOTAKBANK.NS': 1820.2,
    'BHARTIARTL.NS': 1414.3,
    'BAJFINANCE.NS': 7248.7,
    AAPL: 212.4,
    MSFT: 438.2,
    GOOGL: 176.1,
    AMZN: 187.6,
    META: 509.8,
    NVDA: 924.5,
    TSLA: 196.3,
    JPM: 201.2,
    XOM: 118.4,
    UNH: 521.7,
    WMT: 68.3,
    BA: 177.9,
};

const buildFallbackQuotes = (symbols) => symbols.map((symbol, index) => {
    const seed = symbol.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const basePrice = fallbackPriceMap[symbol] || (50 + (seed % 200));
    const drift = ((seed % 9) - 4) * 0.22;
    const dailyChange = Number((drift + ((index % 3) * 0.08)).toFixed(2));

    return {
        symbol,
        name: fallbackStockMeta[symbol]?.name || symbol,
        price: Number(basePrice.toFixed(2)),
        change: dailyChange,
        type: 'STOCK',
        details: buildStockDetails(
            symbol,
            NaN,
            fallbackStockMeta[symbol]?.sector,
            fallbackStockMeta[symbol]?.name,
            fallbackStockMeta[symbol]?.peRatio,
            fallbackStockMeta[symbol]?.dividendYield,
        ),
        financials: null,
    };
});

const hasEnoughLiveData = (quotes) => {
    if (!Array.isArray(quotes) || quotes.length < 6) {
        return false;
    }

    const validPriced = quotes.filter((quote) => Number(quote.price) > 0).length;
    return validPriced >= Math.max(4, Math.floor(quotes.length * 0.5));
};

const buildStockDetails = (symbol, marketCap, sector, longName, peRatio, dividendYield) => ({
    pe_ratio: Number.isFinite(peRatio) ? peRatio : fallbackStockMeta[symbol]?.peRatio ?? null,
    market_cap: Number.isFinite(marketCap) ? `$${(marketCap / 1e9).toFixed(2)}B` : 'N/A',
    dividend_yield: Number.isFinite(dividendYield)
        ? dividendYield.toFixed(2)
        : Number.isFinite(fallbackStockMeta[symbol]?.dividendYield)
            ? Number(fallbackStockMeta[symbol].dividendYield).toFixed(2)
            : 'N/A',
    sector: sector || fallbackStockMeta[symbol]?.sector || 'Unknown',
    about: `${longName || fallbackStockMeta[symbol]?.name || symbol} market data sourced from live providers.`,
});

const toStooqSymbol = (symbol) => {
    const normalized = String(symbol || '').toUpperCase();
    if (normalized.endsWith('.NS') || normalized.endsWith('.BO')) {
        return `${normalized.split('.')[0].toLowerCase()}.in`;
    }

    if (normalized.includes('.')) {
        const [base, market] = normalized.split('.');
        return `${base.toLowerCase()}.${String(market || 'US').toLowerCase()}`;
    }

    return `${normalized.toLowerCase()}.us`;
};

const normalizeStooqSymbol = (stooqSymbol) => {
    const upper = String(stooqSymbol || '').toUpperCase();
    if (upper.endsWith('.IN')) {
        return `${upper.replace('.IN', '')}.NS`;
    }
    if (upper.endsWith('.US')) {
        return upper.replace('.US', '');
    }

    return upper;
};

const fetchYahooQuotes = async (symbols) => {
    const response = await axios.get('https://query1.finance.yahoo.com/v7/finance/quote', {
        params: { symbols: symbols.join(',') },
        timeout: 5000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json',
        },
    });

    const results = response.data?.quoteResponse?.result || [];
    return results
        .filter((item) => item?.symbol)
        .map((item) => ({
            symbol: item.symbol.toUpperCase(),
            name: item.longName || item.shortName || item.symbol,
            price: Number(item.regularMarketPrice) || 0,
            change: Number(item.regularMarketChangePercent) || 0,
            type: 'STOCK',
            details: buildStockDetails(
                item.symbol.toUpperCase(),
                Number(item.marketCap),
                fallbackStockMeta[item.symbol.toUpperCase()]?.sector,
                item.longName || item.shortName,
                Number(item.trailingPE ?? item.forwardPE),
                Number(item.trailingAnnualDividendYield) * 100,
            ),
            financials: null,
        }));
};

const fetchYahooChartQuotes = async (symbols) => {
    const requests = symbols.map(async (symbol) => {
        const normalizedSymbol = String(symbol || '').toUpperCase();
        try {
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}`, {
                params: {
                    range: '5d',
                    interval: '1d',
                    includePrePost: false,
                },
                timeout: 6000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'application/json',
                },
            });

            const result = response.data?.chart?.result?.[0];
            const closes = result?.indicators?.quote?.[0]?.close || [];
            const validCloses = closes.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);

            if (!validCloses.length) {
                return null;
            }

            const last = validCloses[validCloses.length - 1];
            const previous = validCloses.length > 1 ? validCloses[validCloses.length - 2] : last;
            const change = previous > 0 ? Number((((last - previous) / previous) * 100).toFixed(2)) : 0;

            return {
                symbol: normalizedSymbol,
                name: result?.meta?.longName || result?.meta?.shortName || fallbackStockMeta[normalizedSymbol]?.name || normalizedSymbol,
                price: Number(last.toFixed(2)),
                change,
                type: 'STOCK',
                details: buildStockDetails(
                    normalizedSymbol,
                    NaN,
                    fallbackStockMeta[normalizedSymbol]?.sector,
                    result?.meta?.longName || result?.meta?.shortName,
                    NaN,
                    NaN,
                ),
                financials: null,
            };
        } catch (_error) {
            return null;
        }
    });

    const rows = await Promise.all(requests);
    return rows.filter(Boolean);
};

const toPolygonTicker = (symbol) => {
    const normalized = String(symbol || '').toUpperCase();
    if (normalized.endsWith('.NS') || normalized.endsWith('.BO')) {
        return null;
    }

    if (normalized.includes('.')) {
        return normalized.split('.')[0];
    }

    return normalized;
};

const fetchPolygonQuotes = async (symbols) => {
    if (!process.env.POLYGON_API_KEY) {
        throw new Error('Missing POLYGON_API_KEY');
    }

    const polygonTickers = [...new Set(symbols.map(toPolygonTicker).filter(Boolean))];
    if (!polygonTickers.length) {
        return [];
    }

    const res = await axios.get('https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers', {
        params: {
            tickers: polygonTickers.join(','),
            apiKey: process.env.POLYGON_API_KEY,
        },
        timeout: 6000,
    });

    const rows = Array.isArray(res.data?.tickers) ? res.data.tickers : [];
    return rows.map((row) => {
        const ticker = String(row.ticker || '').toUpperCase();
        const price = Number(row?.day?.c);
        const prevClose = Number(row?.prevDay?.c);
        const change = Number.isFinite(price) && Number.isFinite(prevClose) && prevClose > 0
            ? Number((((price - prevClose) / prevClose) * 100).toFixed(2))
            : 0;

        return {
            symbol: ticker,
            name: fallbackStockMeta[ticker]?.name || ticker,
            price: Number.isFinite(price) ? price : 0,
            change,
            type: 'STOCK',
            details: buildStockDetails(ticker, NaN, fallbackStockMeta[ticker]?.sector, fallbackStockMeta[ticker]?.name, NaN, NaN),
            financials: null,
        };
    }).filter((item) => item.symbol);
};

const fetchPolygonHistory = async (symbol, interval = '1D') => {
    if (!process.env.POLYGON_API_KEY) {
        throw new Error('Missing POLYGON_API_KEY');
    }

    const ticker = toPolygonTicker(symbol);
    if (!ticker) {
        throw new Error(`Unsupported Polygon symbol: ${symbol}`);
    }

    const intervalMap = {
        '1D': { multiplier: 15, timespan: 'minute', days: 5 },
        '1W': { multiplier: 1, timespan: 'hour', days: 30 },
        '1M': { multiplier: 1, timespan: 'day', days: 90 },
        '3M': { multiplier: 1, timespan: 'day', days: 180 },
        '6M': { multiplier: 1, timespan: 'day', days: 365 },
        '1Y': { multiplier: 1, timespan: 'day', days: 730 },
    };
    const config = intervalMap[String(interval).toUpperCase()] || intervalMap['1M'];

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - config.days);
    const from = start.toISOString().slice(0, 10);
    const to = end.toISOString().slice(0, 10);

    const res = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${config.multiplier}/${config.timespan}/${from}/${to}`, {
        params: {
            adjusted: 'true',
            sort: 'asc',
            limit: 50000,
            apiKey: process.env.POLYGON_API_KEY,
        },
        timeout: 7000,
    });

    const rows = Array.isArray(res.data?.results) ? res.data.results : [];
    return rows
        .map((row) => ({
            date: new Date(row.t).toLocaleString(),
            price: Number(row.c),
        }))
        .filter((item) => Number.isFinite(item.price));
};

const fetchStooqQuotes = async (symbols) => {
    const pairs = symbols.map((symbol) => toStooqSymbol(symbol)).join(',');
    const stooqUrl = `https://stooq.com/q/l/?s=${pairs}&f=sd2t2ohlcv&h&e=csv`;
    const stooqRes = await axios.get(stooqUrl, { timeout: 5000 });
    const lines = String(stooqRes.data || '').split('\n').slice(1);

    return lines
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split(',');
            if (parts.length < 7) {
                return null;
            }

            const stooqSymbol = (parts[0] || '').toUpperCase();
            const symbol = normalizeStooqSymbol(stooqSymbol);
            const close = Number(parts[6]);

            return {
                symbol,
                name: fallbackStockMeta[symbol]?.name || symbol,
                price: Number.isFinite(close) ? close : 0,
                change: 0,
                type: 'STOCK',
                details: buildStockDetails(symbol, NaN, fallbackStockMeta[symbol]?.sector, fallbackStockMeta[symbol]?.name, NaN, NaN),
                financials: null,
            };
        })
        .filter(Boolean);
};

const fetchYahooHistory = async (symbol, interval = '1D') => {
    const normalizedSymbol = String(symbol || '').toUpperCase();
    const intervalMap = {
        '1D': { range: '5d', interval: '15m' },
        '1W': { range: '1mo', interval: '1h' },
        '1M': { range: '3mo', interval: '1d' },
        '3M': { range: '6mo', interval: '1d' },
        '6M': { range: '1y', interval: '1d' },
        '1Y': { range: '2y', interval: '1d' },
    };
    const config = intervalMap[String(interval).toUpperCase()] || { range: '3mo', interval: '1d' };

    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}`, {
        params: {
            range: config.range,
            interval: config.interval,
            includePrePost: false,
        },
        timeout: 6000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json',
        },
    });

    const result = response.data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];

    return timestamps
        .map((timestamp, index) => {
            const close = Number(closes[index]);
            if (!Number.isFinite(close)) {
                return null;
            }

            return {
                date: new Date(timestamp * 1000).toLocaleString(),
                price: close,
            };
        })
        .filter(Boolean);
};

const fetchStockData = async () => {
    const now = Date.now();
    if (quotesCache.data && now < quotesCache.expiresAt) {
        return quotesCache.data;
    }

    if (quotesInFlightPromise) {
        return quotesInFlightPromise;
    }

    const symbols = parseStockSymbols();

    quotesInFlightPromise = (async () => {
        let data = null;

        if (!isProviderBlocked('yahoo')) {
            let yahooQuotes = [];
            let yahooError = null;
            try {
                yahooQuotes = await fetchYahooQuotes(symbols);
            } catch (error) {
                yahooError = error;
            }

            if (!hasEnoughLiveData(yahooQuotes)) {
                try {
                    const existingSymbols = new Set(yahooQuotes.map((item) => String(item.symbol || '').toUpperCase()));
                    const missingSymbols = symbols.filter((symbol) => !existingSymbols.has(String(symbol || '').toUpperCase()));
                    const chartQuotes = await fetchYahooChartQuotes(missingSymbols.length ? missingSymbols : symbols);
                    const mergedQuotes = [...yahooQuotes, ...chartQuotes].filter((item, index, array) => {
                        const symbol = String(item.symbol || '').toUpperCase();
                        return array.findIndex((row) => String(row.symbol || '').toUpperCase() === symbol) === index;
                    });

                    yahooQuotes = mergedQuotes;
                } catch (_error) {
                }
            }

            if (hasEnoughLiveData(yahooQuotes)) {
                clearProviderFailure('yahoo');
                data = yahooQuotes;
            } else {
                if (yahooError) {
                    logger.warn('Yahoo Finance quote fetch failed, trying Polygon...', { error: yahooError.message });
                }
                markProviderFailure('yahoo', yahooError?.message || 'Sparse quote payload');
            }
        }

        if (!data && !isProviderBlocked('polygon')) {
            try {
                const polygonQuotes = await fetchPolygonQuotes(symbols);
                if (hasEnoughLiveData(polygonQuotes)) {
                    clearProviderFailure('polygon');
                    data = polygonQuotes;
                } else {
                    markProviderFailure('polygon', 'Sparse quote payload');
                }
            } catch (error) {
                markProviderFailure('polygon', error.message);
                logger.warn('Polygon quote fetch failed, trying Stooq...', { error: error.message });
            }
        }

        if (!data && !isProviderBlocked('stooq')) {
            try {
                const stooqQuotes = await fetchStooqQuotes(symbols);
                if (hasEnoughLiveData(stooqQuotes)) {
                    clearProviderFailure('stooq');
                    data = stooqQuotes;
                } else {
                    markProviderFailure('stooq', 'Sparse quote payload');
                }
            } catch (error) {
                markProviderFailure('stooq', error.message);
                logger.warn('Stooq quote fetch failed.', { error: error.message });
            }
        }

        if (!data) {
            logger.warn('All quote providers returned sparse/invalid data. Using synthetic fallback quotes.');
            data = buildFallbackQuotes(symbols);
        }

        quotesCache = {
            data,
            expiresAt: Date.now() + QUOTE_CACHE_TTL_MS,
        };

        return data;
    })();

    try {
        return await quotesInFlightPromise;
    } finally {
        quotesInFlightPromise = null;
    }
};

const fetchStockHistory = async (symbol, interval = '1D') => {
    try {
        const yahooHistory = await fetchYahooHistory(symbol, interval);
        if (yahooHistory.length > 0) {
            return yahooHistory;
        }
    } catch (error) {
        logger.warn('Yahoo Finance history fetch failed, trying Polygon...', { error: error.message });
    }

    try {
        const polygonHistory = await fetchPolygonHistory(symbol, interval);
        if (polygonHistory.length > 0) {
            return polygonHistory;
        }
    } catch (error) {
        logger.warn('Polygon history fetch failed, trying Stooq...', { error: error.message });
    }

    try {
        const normalizedSymbol = String(symbol || '').toUpperCase();
        const stooqSymbol = toStooqSymbol(normalizedSymbol);
        const lookback = {
            '1D': 5,
            '1W': 30,
            '1M': 90,
            '3M': 180,
            '6M': 365,
            '1Y': 730,
        }[String(interval).toUpperCase()] || 120;
        const stooqUrl = `https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`;

        const stooqRes = await axios.get(stooqUrl, { timeout: 5000 });
        const csvData = stooqRes.data;
        const lines = csvData.split('\n').slice(1, lookback + 1);

        const history = lines.map(line => {
            const parts = line.split(',');
            if (parts.length < 5) return null;
            const close = parseFloat(parts[4]);
            if (!Number.isFinite(close)) return null;
            return {
                date: new Date(parts[0]).toLocaleDateString(),
                price: close
            };
        }).filter(item => item !== null).reverse();

        if (history.length > 0) return history;
        throw new Error('Stooq data empty');
    } catch (stooqError) {
        logger.warn('Stooq failed, using generated fallback history.', { error: stooqError.message });
        return generateHistory(150, 0.02, interval);
    }
};

module.exports = { fetchStockData, fetchStockHistory };
