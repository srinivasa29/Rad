const axios = require('axios');
const logger = require('../utils/logger');

const DEFAULT_MARKET_REGION = String(process.env.DEFAULT_MARKET_REGION || 'IN').toUpperCase();
const NEWS_COUNTRY = String(process.env.NEWS_COUNTRY || (DEFAULT_MARKET_REGION === 'US' ? 'us' : 'in')).toLowerCase();
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1/news/all';
const DEFAULT_LIMIT = Number.parseInt(process.env.NEWS_PAGE_SIZE || '6', 10);
const FINNHUB_CATEGORY_MAP = {
    general: 'general',
    business: 'general',
    market: 'general',
    forex: 'forex',
    crypto: 'crypto',
    merger: 'merger',
};

const normalizeSymbol = (value = '') => String(value || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
const normalizeCategory = (value = 'general') => String(value || 'general').trim().toLowerCase();
const toIso = (value) => {
    const date = new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};
const toDisplayTime = (value) => new Date(toIso(value)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const mapArticle = (article) => ({
    id: article?.id || article?.uuid || article?.url,
    source: article?.source?.name || article?.source || 'Unknown',
    title: article?.title || 'Untitled',
    summary: article?.summary || article?.description || article?.snippet || '',
    description: article?.description || article?.summary || article?.snippet || '',
    time: toDisplayTime(article?.publishedAt || article?.published_at || article?.datetime),
    publishedAt: toIso(article?.publishedAt || article?.published_at || article?.datetime),
    url: article?.url || '#',
    sentiment: 'Neutral',
});

const fetchFinnhubNews = async ({ category, symbol, limit }) => {
    if (!process.env.FINNHUB_API_KEY) {
        return [];
    }

    const token = process.env.FINNHUB_API_KEY;
    const normalizedSymbol = normalizeSymbol(symbol);
    const normalizedCategory = normalizeCategory(category);

    if (normalizedSymbol) {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 10);
        const response = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
            params: {
                symbol: normalizedSymbol,
                from: from.toISOString().slice(0, 10),
                to: to.toISOString().slice(0, 10),
                token,
            },
            timeout: 7000,
        });

        const rows = Array.isArray(response.data) ? response.data : [];
        return rows.slice(0, limit).map((item) => mapArticle({
            id: item.id || item.url,
            source: item.source,
            title: item.headline,
            summary: item.summary,
            description: item.summary,
            publishedAt: item.datetime ? new Date(Number(item.datetime) * 1000).toISOString() : new Date().toISOString(),
            url: item.url,
        }));
    }

    const response = await axios.get(`${FINNHUB_BASE_URL}/news`, {
        params: {
            category: FINNHUB_CATEGORY_MAP[normalizedCategory] || 'general',
            token,
        },
        timeout: 7000,
    });
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.slice(0, limit).map((item) => mapArticle({
        id: item.id || item.url,
        source: item.source,
        title: item.headline,
        summary: item.summary,
        description: item.summary,
        publishedAt: item.datetime ? new Date(Number(item.datetime) * 1000).toISOString() : new Date().toISOString(),
        url: item.url,
    }));
};

const fetchMarketAuxNews = async ({ category, symbol, limit }) => {
    if (!process.env.MARKETAUX_API_KEY) {
        return [];
    }

    const params = {
        api_token: process.env.MARKETAUX_API_KEY,
        language: 'en',
        limit,
    };
    if (symbol) {
        params.symbols = normalizeSymbol(symbol);
    }
    if (category && category !== 'general') {
        params.filter_entities = true;
    }

    const response = await axios.get(MARKETAUX_BASE_URL, {
        params,
        timeout: 7000,
    });

    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    return rows.slice(0, limit).map((item) => mapArticle({
        id: item.uuid || item.url,
        source: item.source,
        title: item.title,
        summary: item.snippet || item.description,
        description: item.description || item.snippet,
        publishedAt: item.published_at,
        url: item.url,
    }));
};

const fetchGNews = async ({ limit }) => {
    if (!process.env.GNEWS_API_KEY) {
        return [];
    }
    const url = 'https://gnews.io/api/v4/top-headlines';
    const params = {
        category: 'business',
        lang: 'en',
        country: NEWS_COUNTRY,
        apikey: process.env.GNEWS_API_KEY,
        max: limit,
    };
    const response = await axios.get(url, { params, timeout: 7000 });
    const rows = Array.isArray(response.data?.articles) ? response.data.articles : [];
    return rows.map(mapArticle);
};

const fetchNewsApi = async ({ limit }) => {
    if (!process.env.NEWS_API_KEY) {
        return [];
    }
    const url = 'https://newsapi.org/v2/top-headlines';
    const params = {
        category: 'business',
        language: 'en',
        country: NEWS_COUNTRY,
        apiKey: process.env.NEWS_API_KEY,
        pageSize: limit,
    };
    const response = await axios.get(url, { params, timeout: 7000 });
    const rows = Array.isArray(response.data?.articles) ? response.data.articles : [];
    return rows.map(mapArticle);
};

const fetchMarketNews = async (category = 'general', options = {}) => {
    const normalizedCategory = normalizeCategory(category);
    const symbol = options?.symbol ? normalizeSymbol(options.symbol) : '';
    const limit = Number.isFinite(Number(options?.limit)) ? Number(options.limit) : DEFAULT_LIMIT;

    try {
        const finnhubRows = await fetchFinnhubNews({ category: normalizedCategory, symbol, limit });
        if (finnhubRows.length) {
            return finnhubRows;
        }
    } catch (error) {
        logger.warn('Finnhub news fetch failed, trying MarketAux...', { error: error.message });
    }

    try {
        const marketAuxRows = await fetchMarketAuxNews({ category: normalizedCategory, symbol, limit });
        if (marketAuxRows.length) {
            return marketAuxRows;
        }
    } catch (error) {
        logger.warn('MarketAux news fetch failed, trying GNews...', { error: error.message });
    }

    try {
        const gnewsRows = await fetchGNews({ limit });
        if (gnewsRows.length) {
            return gnewsRows;
        }
    } catch (error) {
        logger.warn('GNews fetch failed, trying NewsAPI...', { error: error.message });
    }

    try {
        const newsApiRows = await fetchNewsApi({ limit });
        if (newsApiRows.length) {
            return newsApiRows;
        }
    } catch (error) {
        logger.warn('NewsAPI fetch failed, using static fallback.', {
            error: error.message,
            code: error.code,
        });
    }

    return [
        {
            id: 1,
            source: "Reuters",
            title: "Global markets rally as inflation shows signs of cooling",
            summary: "Market breadth improved as inflation data cooled across major economies.",
            description: "Market breadth improved as inflation data cooled across major economies.",
            time: "2h ago",
            publishedAt: new Date().toISOString(),
            sentiment: "Bullish",
            url: "#"
        },
        {
            id: 2,
            source: "Bloomberg",
            title: "Tech stocks face pressure ahead of earnings season",
            summary: "Large-cap tech stocks traded mixed ahead of earnings.",
            description: "Large-cap tech stocks traded mixed ahead of earnings.",
            time: "4h ago",
            publishedAt: new Date().toISOString(),
            sentiment: "Bearish",
            url: "#"
        },
        {
            id: 3,
            source: "CNBC",
            title: "Fed signals potential rate cuts later this year",
            summary: "Policy commentary pointed to a data-dependent easing path.",
            description: "Policy commentary pointed to a data-dependent easing path.",
            time: "5h ago",
            publishedAt: new Date().toISOString(),
            sentiment: "Bullish",
            url: "#"
        }
    ];
};

module.exports = { fetchMarketNews };
