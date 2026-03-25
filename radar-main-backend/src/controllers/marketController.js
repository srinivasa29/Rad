const NodeCache = require('node-cache');
const { fetchCryptoData } = require('../services/cryptoService');
const { fetchStockData } = require('../services/stockService');
const { fetchForexData } = require('../services/forexService');
const { normalizeCrypto, normalizeStock, normalizeForex } = require('../utils/normalizer');
const { searchSymbolRegistry, syncSymbolRegistry } = require('../services/symbolRegistryService');

const cache = new NodeCache({ stdTTL: 60 });
const DEFAULT_MARKET_REGION = String(process.env.DEFAULT_MARKET_REGION || 'IN').toUpperCase();
const stripStockSuffix = (value) => String(value || '').replace(/\.(NS|BO)$/i, '');

const getMarketData = async (req, res) => {
    const { type, search, minPrice, maxPrice, minChange, sort } = req.query;

    try {
        let combinedData = cache.get("allMarketData");

        if (!combinedData) {
            const [rawCrypto, rawStocks, rawForex] = await Promise.all([
                fetchCryptoData(),
                fetchStockData(),
                fetchForexData()
            ]);

            const cleanCrypto = normalizeCrypto(rawCrypto);
            const cleanStocks = normalizeStock(rawStocks);
            const cleanForex = normalizeForex(rawForex);
            
            combinedData = [...cleanCrypto, ...cleanStocks, ...cleanForex];
            cache.set("allMarketData", combinedData);
        }

        let result = combinedData;

        if (type) {
            result = result.filter(item => item.type === type.toUpperCase());
        }

        if (search) {
            const term = search.toLowerCase().replace('$', '').replace('#', '');
            result = result.filter(item => 
                item.name.toLowerCase().includes(term) || 
                item.symbol.toLowerCase().includes(term)
            );
        }

        if (minPrice) result = result.filter(item => item.price >= parseFloat(minPrice));
        if (maxPrice) result = result.filter(item => item.price <= parseFloat(maxPrice));
        if (minChange) result = result.filter(item => item.change_24h >= parseFloat(minChange));

        if (sort === 'gainers') {
            result.sort((a, b) => b.change_24h - a.change_24h);
        } else if (sort === 'losers') {
            result.sort((a, b) => a.change_24h - b.change_24h);
        }

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch market data" });
    }
};
const getCryptoBySymbol = async (req, res) => {
    try {
        const { symbol } = req.params;
        const allCrypto = await fetchCryptoData();
        const found = allCrypto.find(c =>
            c.symbol?.toLowerCase() === symbol.toLowerCase() ||
            c.id?.toLowerCase() === symbol.toLowerCase()
        );
        if (!found) {
            return res.status(404).json({ success: false, message: `Crypto symbol '${symbol}' not found` });
        }
        res.json({ success: true, data: found });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const getTrendingSearches = (req, res) => {
    const regionalTrending = {
        IN: ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'BTC', 'USDINR'],
        US: ['AAPL', 'NVDA', 'BTC', 'TSLA', 'ETH', 'MSFT', 'AMD', 'SOL'],
        GLOBAL: ['NIFTY', 'AAPL', 'BTC', 'RELIANCE', 'NVDA', 'ETH', 'TCS', 'EURUSD'],
    };

    const trending = (regionalTrending[DEFAULT_MARKET_REGION] || regionalTrending.IN).map(stripStockSuffix);

    res.json({
        success: true,
        trending,
    });
};
const logSearchEndpoint = (req, res) => {
    res.json({ success: true });
};
const getSearchHistory = (req, res) => {
    res.json({ success: true, history: [] });
};

const searchUniversalSymbols = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const type = req.query.type ? String(req.query.type).toLowerCase() : undefined;
        const limit = Number.parseInt(req.query.limit || '20', 10);

        if (!q) {
            return res.json({ success: true, data: [] });
        }

        const data = await searchSymbolRegistry({ q, type, limit });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Universal symbol search failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to search symbols' });
    }
};

const syncUniversalSymbols = async (_req, res) => {
    try {
        const result = await syncSymbolRegistry();
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Symbol registry sync failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to sync symbol registry' });
    }
};

module.exports = {
    getMarketData,
    getCryptoBySymbol,
    getTrendingSearches,
    logSearchEndpoint,
    getSearchHistory,
    searchUniversalSymbols,
    syncUniversalSymbols,
};