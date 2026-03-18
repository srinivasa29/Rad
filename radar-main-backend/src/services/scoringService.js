const { getTechnicalIndicators, getTrendMatrix } = require('./indicatorService');



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

const getBias = (score) => {
    if (score >= 65) return 'bullish';
    if (score >= 40) return 'neutral';
    return 'bearish';
};

const getInstrumentScore = async (assetType, symbol) => {
    const [indicators, trendMatrix] = await Promise.all([
        getTechnicalIndicators(assetType, symbol, '1D'),
        getTrendMatrix(assetType, symbol)
    ]);

    const rsiPoints = getRsiPoints(indicators.rsi);
    const macdPoints = getMacdPoints(indicators.macd);
    const volumePoints = getVolumePoints(indicators.volumeStatus);
    const trendPoints = getTrendPoints(trendMatrix);

    const score = Math.min(100, rsiPoints + macdPoints + volumePoints + trendPoints);
    const bias = getBias(score);

    return {
        score,
        bias,
        breakdown: {
            rsi: rsiPoints,
            macd: macdPoints,
            volume: volumePoints,
            trend: trendPoints
        }
    };
};

module.exports = { getInstrumentScore };
