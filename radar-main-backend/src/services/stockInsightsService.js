const { fetchStockData } = require('./stockService');
const { fetchMarketNews } = require('./newsService');
const { getFilingsForSymbol } = require('./secService');
const axios = require('axios');
const logger = require('../utils/logger');

const normalizeSymbol = (value) => String(value || '').trim().toUpperCase();
const stripSuffix = (value) => normalizeSymbol(value).replace(/\.(NS|BO)$/i, '');
const toNumber = (value, fallback = NaN) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

const findStock = (stocks, symbol) => {
    const normalized = stripSuffix(symbol);
    return (Array.isArray(stocks) ? stocks : []).find((row) => {
        const rowSymbol = stripSuffix(row?.symbol);
        const rowName = stripSuffix(row?.name);
        return rowSymbol === normalized || rowName === normalized;
    }) || null;
};

const ensureStockFound = async (symbol) => {
    const stocks = await fetchStockData();
    const stock = findStock(stocks, symbol);
    if (!stock) {
        const error = new Error(`Stock ${normalizeSymbol(symbol)} not found`);
        error.statusCode = 404;
        throw error;
    }
    return stock;
};

const getStockFundamentals = async (symbol) => {
    const stock = await ensureStockFound(symbol);
    const normalized = normalizeSymbol(stock.symbol);
    const pe = toNumber(stock?.details?.pe_ratio, NaN);
    const pb = toNumber(stock?.details?.pb_ratio, NaN);
    const dividendYield = toNumber(stock?.details?.dividend_yield, NaN);

    const result = {
        symbol: normalized,
        name: stock.name || normalized,
        snapshot: {
            price: toNumber(stock.price, NaN),
            change: toNumber(stock.change, NaN),
            marketCap: stock?.details?.market_cap || null,
            peRatio: Number.isFinite(pe) ? Number(pe.toFixed(2)) : null,
            pbRatio: Number.isFinite(pb) ? Number(pb.toFixed(2)) : null,
            dividendYield: Number.isFinite(dividendYield) ? Number(dividendYield.toFixed(2)) : null,
            sector: stock?.details?.sector || 'Unknown',
        },
        financialStatements: {
            incomeStatement: stock?.financials?.income_statement || [],
            balanceSheet: stock?.financials?.balance_sheet || [],
            cashFlow: stock?.financials?.cash_flow || [],
        },
        notes: stock?.financials
            ? 'Financial statements sourced from provider payload'
            : 'Detailed statements unavailable in current provider payload',
    };

    if (process.env.FMP_API_KEY) {
        try {
            const ticker = stripSuffix(normalized);
            const key = process.env.FMP_API_KEY;
            const [profileRes, ratiosRes] = await Promise.all([
                axios.get(`${FMP_BASE_URL}/profile/${encodeURIComponent(ticker)}`, {
                    params: { apikey: key },
                    timeout: 7000,
                }),
                axios.get(`${FMP_BASE_URL}/ratios-ttm/${encodeURIComponent(ticker)}`, {
                    params: { apikey: key },
                    timeout: 7000,
                }),
            ]);

            const profile = Array.isArray(profileRes.data) ? profileRes.data[0] : null;
            const ratios = Array.isArray(ratiosRes.data) ? ratiosRes.data[0] : null;
            const peFromFmp = toNumber(ratios?.peRatioTTM, NaN);
            const pbFromFmp = toNumber(ratios?.priceToBookRatioTTM, NaN);
            const dyFromFmp = toNumber(profile?.lastDiv, NaN);
            const marketCap = toNumber(profile?.mktCap, NaN);

            if (Number.isFinite(peFromFmp)) result.snapshot.peRatio = Number(peFromFmp.toFixed(2));
            if (Number.isFinite(pbFromFmp)) result.snapshot.pbRatio = Number(pbFromFmp.toFixed(2));
            if (Number.isFinite(dyFromFmp)) result.snapshot.dividendYield = Number(dyFromFmp.toFixed(2));
            if (Number.isFinite(marketCap)) result.snapshot.marketCap = `$${(marketCap / 1e9).toFixed(2)}B`;
            if (profile?.sector) result.snapshot.sector = profile.sector;
            result.notes = 'Fundamentals enriched by FMP with provider fallback to market data.';
        } catch (error) {
            logger.warn('FMP fundamentals fetch failed, using stock snapshot fallback.', { error: error.message });
        }
    }

    return result;
};

const getStockEarningsCalendar = async (symbol) => {
    const stock = await ensureStockFound(symbol);
    const normalized = normalizeSymbol(stock.symbol);
    const ticker = stripSuffix(normalized);

    if (process.env.FMP_API_KEY) {
        try {
            const key = process.env.FMP_API_KEY;
            const today = new Date();
            const future = new Date();
            future.setMonth(future.getMonth() + 12);
            const from = today.toISOString().slice(0, 10);
            const to = future.toISOString().slice(0, 10);

            const response = await axios.get(`${FMP_BASE_URL}/earning_calendar`, {
                params: {
                    symbol: ticker,
                    from,
                    to,
                    apikey: key,
                },
                timeout: 7000,
            });

            const rows = Array.isArray(response.data) ? response.data : [];
            const items = rows.slice(0, 12).map((row, index) => ({
                id: `${normalized}-fmp-${index}`,
                date: row.date || null,
                period: row.period || null,
                event: 'Earnings',
                description: `EPS estimated ${row.epsEstimated ?? '-'} / reported ${row.eps ?? '-'}`,
                source: 'FMP',
            }));

            if (items.length > 0) {
                return {
                    symbol: normalized,
                    name: stock.name || normalized,
                    count: items.length,
                    events: items,
                };
            }
        } catch (error) {
            logger.warn('FMP earnings calendar fetch failed, falling back to SEC filings.', { error: error.message });
        }
    }

    const filings = await getFilingsForSymbol(stripSuffix(normalized));
    const items = (Array.isArray(filings) ? filings : []).slice(0, 12).map((filing, index) => ({
        id: `${normalized}-${index}`,
        date: filing.filingDate || filing.reportDate || null,
        period: filing.reportDate || null,
        event: filing.form || 'Filing',
        description: filing.description || filing.primaryDocument || 'Regulatory filing',
        source: 'SEC',
    }));

    return {
        symbol: normalized,
        name: stock.name || normalized,
        count: items.length,
        events: items,
    };
};

const classifySentiment = (title) => {
    const text = String(title || '').toLowerCase();
    const positiveWords = ['rally', 'beat', 'surge', 'upgrade', 'growth', 'record', 'strong'];
    const negativeWords = ['fall', 'slump', 'miss', 'downgrade', 'weak', 'drop', 'risk'];

    const positiveHits = positiveWords.filter((word) => text.includes(word)).length;
    const negativeHits = negativeWords.filter((word) => text.includes(word)).length;

    if (positiveHits > negativeHits) return { sentiment: 'positive', score: 0.7 };
    if (negativeHits > positiveHits) return { sentiment: 'negative', score: -0.7 };
    return { sentiment: 'neutral', score: 0 };
};

const getStockNewsSentiment = async (symbol) => {
    const stock = await ensureStockFound(symbol);
    const normalized = stripSuffix(stock.symbol);

    const rawNews = await fetchMarketNews('business', { symbol: normalized, limit: 20 });
    const rows = (Array.isArray(rawNews) ? rawNews : []).filter((item) => {
        const text = `${item?.title || ''} ${item?.summary || ''} ${item?.description || ''}`.toUpperCase();
        return text.includes(normalized);
    });

    const scored = rows.slice(0, 20).map((item, index) => {
        const cls = classifySentiment(item?.title);
        return {
            id: `${normalized}-news-${index}`,
            title: item?.title || 'Untitled',
            source: item?.source || 'News',
            publishedAt: item?.publishedAt || item?.time || new Date().toISOString(),
            sentiment: cls.sentiment,
            sentimentScore: cls.score,
            url: item?.url || null,
        };
    });

    const aggregate = scored.reduce((acc, row) => acc + Number(row.sentimentScore || 0), 0);
    const avg = scored.length ? aggregate / scored.length : 0;

    return {
        symbol: normalizeSymbol(stock.symbol),
        name: stock.name || normalizeSymbol(stock.symbol),
        count: scored.length,
        aggregateSentiment: avg > 0.15 ? 'positive' : avg < -0.15 ? 'negative' : 'neutral',
        aggregateScore: Number(avg.toFixed(3)),
        articles: scored,
    };
};

module.exports = {
    getStockFundamentals,
    getStockEarningsCalendar,
    getStockNewsSentiment,
};
