const { calculateRSI, calculateMACD, calculateEMA, calculateSMA, calculateBollinger, calculateATR, calculateVWAP, calculateMomentum, getVolumeStatus } = require('../utils/indicators');
const { fetchStockHistory } = require('./stockService');
const { fetchCryptoHistory } = require('./cryptoService');
const { fetchForexHistory } = require('./forexService');
const ohlcService = require('./ohlcService');

const getTechnicalIndicators = async (assetType, symbol, interval = '1D', options = {}) => {
    const { strictLive = false } = options;
    let history = [];
    const type = assetType?.toLowerCase();
    if (type === 'crypto') {
        history = await fetchCryptoHistory(symbol, interval);
    } else if (type === 'forex') {
        history = await fetchForexHistory(symbol, interval);
    } else if (type === 'stock') {
        history = await fetchStockHistory(symbol, interval, { allowSynthetic: !strictLive });
    } else {
        throw new Error(`Unsupported asset type for indicators: ${assetType}`);
    }

    if (!history || history.length < 26) {
        return {
            rsi: null,
            macd: null,
            ema20: null,
            ema50: null,
            ema200: null,
            sma50: null,
            sma200: null,
            bollinger: null,
            volumeStatus: 'average',
            lastPrice: history?.length ? (history[history.length - 1].price ?? history[history.length - 1].close) : null,
            previousPrice: history?.length > 1 ? (history[history.length - 2].price ?? history[history.length - 2].close) : null,
            lastChangePercent: null,
            lastUpdatedAt: history?.length ? history[history.length - 1].date : null,
            status: 'insufficient_data'
        };
    }
    const rsiRaw = calculateRSI(history, 14);
    const rsi = rsiRaw.length > 0 ? rsiRaw[rsiRaw.length - 1].value : null;

    const macdRaw = calculateMACD(history);
    const validMacd = macdRaw.filter(m => m.value != null && !isNaN(m.value));
    const macd = validMacd.length > 0 ? {
        value: validMacd[validMacd.length - 1].value,
        signal: validMacd[validMacd.length - 1].signal
    } : null;

    const prices = history.map(h => h.price ?? h.close);
    const closes = prices;
    const highs = history.map(h => h.high ?? h.price ?? h.close);
    const lows = history.map(h => h.low ?? h.price ?? h.close);

    const ema20Raw = calculateEMA(prices, 20);
    const ema50Raw = calculateEMA(prices, 50);
    const ema200Raw = calculateEMA(prices, 200);
    const ema20 = ema20Raw.length > 0 ? parseFloat(ema20Raw[ema20Raw.length - 1].toFixed(2)) : null;
    const ema50 = ema50Raw.length > 0 ? parseFloat(ema50Raw[ema50Raw.length - 1].toFixed(2)) : null;
    const ema200 = ema200Raw.length > 0 ? parseFloat(ema200Raw[ema200Raw.length - 1].toFixed(2)) : null;

    const sma50Raw = calculateSMA(history, 50);
    const sma200Raw = calculateSMA(history, 200);
    const sma50 = sma50Raw.length > 0 ? parseFloat(sma50Raw[sma50Raw.length - 1].value.toFixed(2)) : null;
    const sma200 = sma200Raw.length > 0 ? parseFloat(sma200Raw[sma200Raw.length - 1].value.toFixed(2)) : null;

    const bollingerRaw = calculateBollinger(history, 20, 2);
    const bollinger = bollingerRaw.length > 0 ? bollingerRaw[bollingerRaw.length - 1] : null;

    let support = null;
    let resistance = null;
    if (closes.length >= 20) {
        const recent20 = closes.slice(-20);
        support = parseFloat(Math.min(...recent20).toFixed(2));
        resistance = parseFloat(Math.max(...recent20).toFixed(2));
    }

    const volumeStatus = getVolumeStatus(history, 20);
    const last = history[history.length - 1] || null;
    const previous = history[history.length - 2] || null;
    const lastPrice = Number(last?.close ?? last?.price);
    const previousPrice = Number(previous?.close ?? previous?.price);
    const lastChangePercent = Number.isFinite(lastPrice) && Number.isFinite(previousPrice) && previousPrice > 0
        ? Number((((lastPrice - previousPrice) / previousPrice) * 100).toFixed(2))
        : null;
    const lastUpdatedAt = last?.datetime || last?.date || null;

    let atr = null;
    try {
        const atrRaw = calculateATR(history, 14);
        atr = atrRaw.length > 0 ? atrRaw[atrRaw.length - 1].value : null;
    } catch (e) {
        console.error('ATR calc failure:', e.message);
    }

    let vwap = null;
    try {
        const vwapRaw = calculateVWAP(history);
        vwap = vwapRaw.length > 0 ? vwapRaw[vwapRaw.length - 1].value : null;
    } catch (e) {
        console.error('VWAP calc failure:', e.message);
    }

    let momentum = null;
    try {
        const momentumRaw = calculateMomentum(history, 10);
        momentum = momentumRaw.length > 0 ? momentumRaw[momentumRaw.length - 1].value : null;
    } catch (e) {
        console.error('Momentum calc failure:', e.message);
    }

    return {
        rsi,
        macd,
        ema20,
        ema50,
        ema200,
        sma50,
        sma200,
        bollinger,
        support,
        resistance,
        volumeStatus,
        atr,
        vwap,
        momentum,
        lastPrice: Number.isFinite(lastPrice) ? lastPrice : null,
        previousPrice: Number.isFinite(previousPrice) ? previousPrice : null,
        lastChangePercent,
        lastUpdatedAt,
    };
};

const getTrendMatrix = async (assetType, symbol, options = {}) => {
    const timeframes = ['5M', '15M', '1H', '1D'];
    const trendMatrix = {};

    for (const tf of timeframes) {
        try {
            const data = await getTechnicalIndicators(assetType, symbol, tf, options);
            let bias = 'neutral';

            if (data.rsi && data.ema20) {
                if (data.rsi > 60 && data.macd && data.macd.value > data.macd.signal) {
                    bias = 'bullish';
                } else if (data.rsi < 40 && data.macd && data.macd.value < data.macd.signal) {
                    bias = 'bearish';
                } else {
                    bias = 'neutral';
                }
            }
            trendMatrix[tf.toLowerCase()] = bias;
        } catch (error) {
            trendMatrix[tf.toLowerCase()] = 'neutral';
        }
    }

    return trendMatrix;
};

/**
 * Calculate technical indicators from seeded OHLC data (database-backed, fast)
 * Preferred for screeners and bulk calculations using our Nifty 50 universe
 */
const getTechnicalIndicatorsFromOHLC = async (symbol, exchange = 'NSE', timeframe = '1d', limit = 365) => {
    try {
        // Fetch OHLC data from database
        const ohlcResult = await ohlcService.getOHLCData({
            symbol: symbol.toUpperCase(),
            exchange: exchange.toUpperCase(),
            timeframe,
            limit,
        });

        if (!ohlcResult.success || !ohlcResult.data || ohlcResult.data.length < 26) {
            return {
                rsi: null,
                macd: null,
                ema20: null,
                ema50: null,
                ema200: null,
                sma50: null,
                sma200: null,
                bollinger: null,
                support: null,
                resistance: null,
                volumeStatus: 'average',
                atr: null,
                lastPrice: ohlcResult.data?.length ? ohlcResult.data[ohlcResult.data.length - 1].close : null,
                previousPrice: ohlcResult.data?.length > 1 ? ohlcResult.data[ohlcResult.data.length - 2].close : null,
                lastChangePercent: null,
                lastUpdatedAt: ohlcResult.data?.length ? ohlcResult.data[ohlcResult.data.length - 1].timestamp : null,
                status: 'insufficient_data',
                source: 'ohlc_db',
            };
        }

        // Convert OHLC records to history format for indicator calculation
        const history = ohlcResult.data.map(candle => ({
            date: candle.timestamp,
            price: candle.close,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            volume: candle.volume,
        }));

        // Calculate indicators
        const rsiRaw = calculateRSI(history, 14);
        const rsi = rsiRaw.length > 0 ? rsiRaw[rsiRaw.length - 1].value : null;

        const macdRaw = calculateMACD(history);
        const validMacd = macdRaw.filter(m => m.value != null && !isNaN(m.value));
        const macd = validMacd.length > 0 ? {
            value: validMacd[validMacd.length - 1].value,
            signal: validMacd[validMacd.length - 1].signal,
        } : null;

        const prices = history.map(h => h.price);
        const ema20Raw = calculateEMA(prices, 20);
        const ema50Raw = calculateEMA(prices, 50);
        const ema200Raw = calculateEMA(prices, 200);
        const ema20 = ema20Raw.length > 0 ? parseFloat(ema20Raw[ema20Raw.length - 1].toFixed(2)) : null;
        const ema50 = ema50Raw.length > 0 ? parseFloat(ema50Raw[ema50Raw.length - 1].toFixed(2)) : null;
        const ema200 = ema200Raw.length > 0 ? parseFloat(ema200Raw[ema200Raw.length - 1].toFixed(2)) : null;

        const sma50Raw = calculateSMA(history, 50);
        const sma200Raw = calculateSMA(history, 200);
        const sma50 = sma50Raw.length > 0 ? parseFloat(sma50Raw[sma50Raw.length - 1].value.toFixed(2)) : null;
        const sma200 = sma200Raw.length > 0 ? parseFloat(sma200Raw[sma200Raw.length - 1].value.toFixed(2)) : null;

        const bollingerRaw = calculateBollinger(history, 20, 2);
        const bollinger = bollingerRaw.length > 0 ? bollingerRaw[bollingerRaw.length - 1] : null;

        // Support and resistance
        let support = null;
        let resistance = null;
        if (prices.length >= 20) {
            const recent20 = prices.slice(-20);
            support = parseFloat(Math.min(...recent20).toFixed(2));
            resistance = parseFloat(Math.max(...recent20).toFixed(2));
        }

        // Volume status
        const volumeStatus = getVolumeStatus(history, 20);

        // ATR (Average True Range)
        let atr = null;
        try {
            const atrRaw = calculateATR(history, 14);
            atr = atrRaw.length > 0 ? atrRaw[atrRaw.length - 1].value : null;
        } catch (e) {
            console.error('ATR calc failure:', e.message);
        }

        // VWAP
        let vwap = null;
        try {
            const vwapRaw = calculateVWAP(history);
            vwap = vwapRaw.length > 0 ? vwapRaw[vwapRaw.length - 1].value : null;
        } catch (e) {
            console.error('VWAP calc failure:', e.message);
        }

        // Momentum
        let momentum = null;
        try {
            const momentumRaw = calculateMomentum(history, 10);
            momentum = momentumRaw.length > 0 ? momentumRaw[momentumRaw.length - 1].value : null;
        } catch (e) {
            console.error('Momentum calc failure:', e.message);
        }

        const lastCandle = history[history.length - 1];
        const previousCandle = history[history.length - 2];
        const lastPrice = Number(lastCandle?.price);
        const previousPrice = Number(previousCandle?.price);
        const lastChangePercent = Number.isFinite(lastPrice) && Number.isFinite(previousPrice) && previousPrice > 0
            ? Number((((lastPrice - previousPrice) / previousPrice) * 100).toFixed(2))
            : null;

        return {
            rsi,
            macd,
            ema20,
            ema50,
            ema200,
            sma50,
            sma200,
            bollinger,
            support,
            resistance,
            volumeStatus,
            atr,
            vwap,
            momentum,
            lastPrice: Number.isFinite(lastPrice) ? lastPrice : null,
            previousPrice: Number.isFinite(previousPrice) ? previousPrice : null,
            lastChangePercent,
            lastUpdatedAt: lastCandle?.date || null,
            status: 'success',
            source: 'ohlc_db',
            dataPoints: ohlcResult.data.length,
        };
    } catch (error) {
        console.error(`Error calculating indicators from OHLC for ${symbol}:`, error);
        return {
            rsi: null,
            macd: null,
            ema20: null,
            ema50: null,
            ema200: null,
            sma50: null,
            sma200: null,
            bollinger: null,
            support: null,
            resistance: null,
            volumeStatus: 'average',
            atr: null,
            lastPrice: null,
            previousPrice: null,
            lastChangePercent: null,
            lastUpdatedAt: null,
            status: 'error',
            source: 'ohlc_db',
            error: error.message,
        };
    }
};

module.exports = { getTechnicalIndicators, getTrendMatrix, getTechnicalIndicatorsFromOHLC };
