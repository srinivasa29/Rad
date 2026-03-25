const { getTechnicalIndicators, getTrendMatrix } = require('./indicatorService');

const parseThreshold = (value, fallback) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const FORCE_BEARISH_DROP_PCT = parseThreshold(process.env.TECH_FORCE_BEARISH_DROP_PCT, -1.5);
const CAP_BULLISH_DROP_PCT = parseThreshold(process.env.TECH_CAP_BULLISH_DROP_PCT, -0.75);



const getVolumePoints = (volumeStatus) => {
    const map = {
        high_volume: 15,
        above_average: 12,
        average: 8,
        below_average: 4,
        low_volume: 0
    };
    return map[volumeStatus] ?? 8;
};

const getRsiPoints = (rsi) => {
    if (rsi === null) return 15;
    if (rsi >= 45 && rsi <= 65) return 30;
    if (rsi >= 30 && rsi < 45) return 20;
    if (rsi > 65 && rsi <= 75) return 20;
    if (rsi >= 20 && rsi < 30) return 10;
    if (rsi > 75 && rsi <= 85) return 10;
    return 5;
};

const getMacdPoints = (macd) => {
    if (!macd) return 12;
    const diff = macd.value - macd.signal;
    if (diff > 1) return 25;
    if (diff > 0) return 18;
    if (diff > -0.5) return 12;
    if (diff > -1) return 7;
    return 3;
};

const getTrendPoints = (trendMatrix) => {
    let points = 0;
    for (const tf of Object.values(trendMatrix)) {
        if (tf === 'bullish') points += 7.5;
        else if (tf === 'neutral') points += 3.75;
    }
    return Math.round(points);
};

const getPriceActionPoints = (lastChangePercent) => {
    const change = Number(lastChangePercent);
    if (!Number.isFinite(change)) return 12;
    if (change <= -2.5) return 0;
    if (change <= -1.0) return 4;
    if (change <= -0.3) return 8;
    if (change < 0.3) return 12;
    if (change < 1.0) return 16;
    if (change < 2.5) return 20;
    return 24;
};

const getBias = (score) => {
    if (score >= 65) return 'bullish';
    if (score >= 40) return 'neutral';
    return 'bearish';
};

const getInstrumentScore = async (assetType, symbol, options = {}) => {
    const [indicators, trendMatrix] = await Promise.all([
        getTechnicalIndicators(assetType, symbol, '1D', options),
        getTrendMatrix(assetType, symbol, options)
    ]);

    const rsiPoints = getRsiPoints(indicators.rsi);
    const macdPoints = getMacdPoints(indicators.macd);
    const volumePoints = getVolumePoints(indicators.volumeStatus);
    const trendPoints = getTrendPoints(trendMatrix);
    const priceActionPoints = getPriceActionPoints(indicators.lastChangePercent);

    let score = Math.min(100, rsiPoints + macdPoints + volumePoints + trendPoints + priceActionPoints);
    let bias = getBias(score);

    const lastChange = Number(indicators.lastChangePercent);
    if (Number.isFinite(lastChange) && lastChange <= FORCE_BEARISH_DROP_PCT) {
        score = Math.min(score, 39);
        bias = 'bearish';
    } else if (Number.isFinite(lastChange) && lastChange <= CAP_BULLISH_DROP_PCT && bias === 'bullish') {
        score = Math.min(score, 64);
        bias = 'neutral';
    }

    return {
        score,
        bias,
        breakdown: {
            rsi: rsiPoints,
            macd: macdPoints,
            volume: volumePoints,
            trend: trendPoints,
            priceAction: priceActionPoints,
        },
        context: {
            lastChangePercent: Number.isFinite(lastChange) ? lastChange : null,
            lastUpdatedAt: indicators.lastUpdatedAt || null,
            forceBearishDropPercent: FORCE_BEARISH_DROP_PCT,
            capBullishDropPercent: CAP_BULLISH_DROP_PCT,
        },
    };
};

module.exports = { getInstrumentScore };
