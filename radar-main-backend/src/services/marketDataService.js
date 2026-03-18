const { fetchCryptoData } = require('./cryptoService');
const { fetchForexData } = require('./forexService');
const { fetchStockData } = require('./stockService');
const logger = require('../config/logger');

const normalizeForexPair = (symbol = '') => {
    const clean = String(symbol).toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length === 6) {
        return `${clean.slice(0, 3)}/${clean.slice(3)}`;
    }
    return String(symbol).toUpperCase().replace('-', '/');
};

const providers = {
    crypto: async (symbol) => {
        const all = await fetchCryptoData();
        if (symbol) {
            const found = all.find(c => c.symbol?.toLowerCase() === symbol.toLowerCase() || c.id?.toLowerCase() === symbol.toLowerCase());
            if (!found) throw new Error(`Crypto ${symbol} not found`);
            return found;
        }
        return all;
    },
    forex: async (symbol) => {
        const all = await fetchForexData();
        if (symbol) {
            const pair = normalizeForexPair(symbol);
            const found = all.find(f => f.ticker === pair);
            if (!found) throw new Error(`Forex pair ${symbol} not found`);
            return found;
        }
        return all;
    },
    stock: async (symbol) => {
        const all = await fetchStockData();
        if (symbol) {
            const found = all.find(s => s.symbol === symbol.toUpperCase());
            if (!found) throw new Error(`Stock ${symbol} not found`);
            return found;
        }
        return all;
    }
};

const getMarketData = async (assetType, symbol) => {
    const type = assetType?.toLowerCase();

    if (!providers[type]) {
        throw new Error(`Unknown asset type: ${assetType}. Use crypto, forex, or stock.`);
    }

    return await providers[type](symbol);
};

module.exports = { getMarketData };
