const { fetchCryptoHistory } = require('../services/cryptoService');
const { fetchStockHistory } = require('../services/stockService');
const { fetchForexHistory } = require('../services/forexService');
const { calculateSMA, calculateRSI, calculateBollinger, calculateMACD } = require('../utils/indicators');

const getHistory = async (req, res) => {
    const { symbol, type, interval = '1D' } = req.query; 
    const strictLive = String(req.query.strictLive || '').toLowerCase() === 'true';
    
    if (!symbol) return res.status(400).json({ error: "Symbol required" });

    let rawData = [];

    if (type === 'STOCK') {
        rawData = await fetchStockHistory(symbol.toLowerCase(), interval, { allowSynthetic: !strictLive });
    } 
    else if (type === 'FOREX') {
        rawData = await fetchForexHistory(symbol.toLowerCase(), interval);
    } 
    else {
        rawData = await fetchCryptoHistory(symbol.toLowerCase(), interval);
    }

    if (!rawData || rawData.length === 0) {
        return res.status(404).json({ error: "History data unavailable" });
    }
    
    res.json({
        prices: rawData,
        indicators: {
            sma: calculateSMA(rawData, 20),
            rsi: calculateRSI(rawData, 14),
            bollinger: calculateBollinger(rawData, 20),
            macd: calculateMACD(rawData)
        }
    });
};

module.exports = { getHistory };

