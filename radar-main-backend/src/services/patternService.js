const { getTechnicalIndicators } = require('./indicatorService');
const { fetchStockHistory } = require('./stockService');
const { fetchCryptoHistory } = require('./cryptoService');
const { fetchForexHistory } = require('./forexService');



const detectBullFlag = (history) => {
    if (history.length < 15) return null;
    const slice = history.slice(-15);
    const flagpoleStart = slice[0].price;
    const flagpolePeak = Math.max(...slice.slice(1, 8).map(h => h.price));
    if ((flagpolePeak - flagpoleStart) / flagpoleStart < 0.05) return null;
    const recent = slice.slice(-5);
    const recentLow = Math.min(...recent.map(h => h.price));

    if (recentLow > flagpoleStart + (flagpolePeak - flagpoleStart) * 0.5) {
        return { pattern: "Bull Flag", confidence: 75, description: "Strong run-up followed by healthy consolidation." };
    }
    return null;
};

const detectDoubleBottom = (history) => {
    if (history.length < 20) return null;

    const slice = history.slice(-20);
    const prices = slice.map(h => h.price);
    const minPrice = Math.min(...prices);
    let troughCount = 0;
    let inTrough = false;

    for (const price of prices) {
        if (price <= minPrice * 1.01) {
            if (!inTrough) {
                troughCount++;
                inTrough = true;
            }
        } else {
            inTrough = false;
        }
    }

    if (troughCount >= 2) {
        return { pattern: "Double Bottom", confidence: 80, description: "Price rejected twice from a support floor, suggesting a reversal." };
    }
    return null;
};

const detectPatterns = async (assetType, symbol, options = {}) => {
    const { strictLive = false } = options;
    let history = [];
    const type = assetType?.toLowerCase();

    if (type === 'crypto') {
        history = await fetchCryptoHistory(symbol, '1D');
    } else if (type === 'forex') {
        history = await fetchForexHistory(symbol, '1D');
    } else if (type === 'stock') {
        history = await fetchStockHistory(symbol, '1D', { allowSynthetic: !strictLive });
    } else {
        throw new Error(`Unsupported asset type: ${assetType}`);
    }

    if (!history || history.length < 20) {
        return [];
    }

    const detected = [];

    const bullFlag = detectBullFlag(history);
    if (bullFlag) detected.push(bullFlag);

    const doubleBottom = detectDoubleBottom(history);
    if (doubleBottom) detected.push(doubleBottom);
    if (detected.length === 0) {
        try {
            const indicators = await getTechnicalIndicators(assetType, symbol, '1D', options);
            if (indicators.rsi && indicators.rsi < 35) {
                detected.push({ pattern: "Oversold Reversal", confidence: 60, description: "RSI deep in the oversold territory, potential bounce incoming." });
            } else if (indicators.rsi && indicators.rsi > 70) {
                detected.push({ pattern: "Overbought Top", confidence: 60, description: "Extended momentum, risk of a pullback." });
            }
        } catch (e) { }
    }

    return detected;
};

module.exports = { detectPatterns };
