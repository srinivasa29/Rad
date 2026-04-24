const normalizeCrypto = (data) => {
    return data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change_24h: coin.price_change_percentage_24h,
        image: coin.image,
        type: 'CRYPTO',
        details: coin.details 
    }));
};

const cleanSymbolSuffix = (value) => String(value || '').replace(/\.(NS|BO)$/i, '');

const normalizeStock = (data) => {
    return data.map(stock => ({
        id: cleanSymbolSuffix(stock.symbol),
        symbol: cleanSymbolSuffix(stock.symbol),
        name: stock.name,
        price: stock.price,
        change_24h: stock.change,
        image: null,
        type: 'STOCK',
        details: stock.details,
        financials: stock.financials
    }));
};

const normalizeForex = (data) => {
    return data.map(pair => ({
        id: pair.ticker,
        symbol: pair.ticker,
        name: pair.name,
        price: (pair.bid + pair.ask) / 2,
        change_24h: pair.change,
        image: null,
        type: 'FOREX',
        details: pair.details 
    }));
};

module.exports = { normalizeCrypto, normalizeStock, normalizeForex };