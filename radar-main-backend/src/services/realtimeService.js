const WebSocket = require('ws');
const logger = require('../utils/logger');

let io;
let cryptoSocket;
let cryptoReconnectTimer;
let cryptoReconnectAttempts = 0;
let cryptoConnectedAt = 0;
let lastReconnectLogAt = 0;
let lastLoggedReconnectDelay = null;
let lastNormalCloseLogAt = 0;
let lastWsErrorKey = null;
let lastWsErrorLogAt = 0;
let lastCloseCodeLogAt = 0;
let lastCloseCodeLogged = null;
let tickerInterval = null;

const CRYPTO_RECONNECT_BASE_DELAY_MS = 5000;
const CRYPTO_RECONNECT_MAX_DELAY_MS = 60000;
const STABLE_CONNECTION_THRESHOLD_MS = 15000;
const RECONNECT_LOG_THROTTLE_MS = 120000;
const MAX_BACKOFF_RECONNECT_LOG_THROTTLE_MS = 600000;
const NORMAL_CLOSE_LOG_THROTTLE_MS = 300000;
const WS_ERROR_LOG_THROTTLE_MS = 120000;
const CLOSE_CODE_LOG_THROTTLE_MS = 120000;
const BINANCE_STREAM_MAP = {
    BTCUSDT: 'bitcoin',
    ETHUSDT: 'ethereum',
    SOLUSDT: 'solana',
    XRPUSDT: 'ripple',
    BNBUSDT: 'binance-coin',
};

const initRealtimeService = (socketIoInstance) => {
    io = socketIoInstance;
    logger.info("Realtime Service Initialized");

    startCryptoStream();
    startTickerInterval();
};

const clearCryptoReconnectTimer = () => {
    if (cryptoReconnectTimer) {
        clearTimeout(cryptoReconnectTimer);
        cryptoReconnectTimer = null;
    }
};

const cleanupCryptoSocket = () => {
    if (!cryptoSocket) {
        return;
    }

    cryptoSocket.removeAllListeners();

    if (cryptoSocket.readyState === WebSocket.OPEN || cryptoSocket.readyState === WebSocket.CONNECTING) {
        cryptoSocket.terminate();
    }

    cryptoSocket = null;
};

const scheduleCryptoReconnect = () => {
    if (cryptoReconnectTimer) {
        return;
    }

    const delay = Math.min(
        CRYPTO_RECONNECT_BASE_DELAY_MS * (2 ** cryptoReconnectAttempts),
        CRYPTO_RECONNECT_MAX_DELAY_MS,
    );

    const reconnectLogThrottle =
        delay >= CRYPTO_RECONNECT_MAX_DELAY_MS
            ? MAX_BACKOFF_RECONNECT_LOG_THROTTLE_MS
            : RECONNECT_LOG_THROTTLE_MS;

    const now = Date.now();
    const shouldLogReconnect =
        lastLoggedReconnectDelay !== delay ||
        now - lastReconnectLogAt >= reconnectLogThrottle;

    if (shouldLogReconnect) {
        logger.warn(`Binance WS disconnected. Reconnecting in ${Math.round(delay / 1000)}s.`);
        lastReconnectLogAt = now;
        lastLoggedReconnectDelay = delay;
    }

    cryptoReconnectTimer = setTimeout(() => {
        cryptoReconnectTimer = null;
        startCryptoStream();
    }, delay);
};

const startCryptoStream = () => {
    const wsUrl = 'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker/bnbusdt@ticker';

    clearCryptoReconnectTimer();
    cleanupCryptoSocket();
    cryptoSocket = new WebSocket(wsUrl);

    cryptoSocket.on('open', () => {
        cryptoConnectedAt = Date.now();
        lastLoggedReconnectDelay = null;

        if (cryptoReconnectAttempts > 0) {
            logger.info('Reconnected to Binance WebSocket');
        } else {
            logger.info('Connected to Binance WebSocket');
        }
    });

    cryptoSocket.on('message', (data) => {
        try {
            const payload = JSON.parse(data);
            const ticker = payload?.data;
            const symbol = ticker?.s;
            const mappedAsset = symbol ? BINANCE_STREAM_MAP[symbol] : null;

            if (!mappedAsset || !ticker?.c) {
                return;
            }

            const prices = { [mappedAsset]: ticker.c };
            if (io) {
                io.to('ticker').emit('cryptoUpdate', prices);
            }
        } catch (error) {
            logger.error("WS Parse Error", { error: error.message });
        }
    });

    cryptoSocket.on('close', (code) => {
        const now = Date.now();
        const connectionLifetime = cryptoConnectedAt ? Date.now() - cryptoConnectedAt : 0;

        if (connectionLifetime >= STABLE_CONNECTION_THRESHOLD_MS) {
            cryptoReconnectAttempts = 0;
        } else {
            cryptoReconnectAttempts += 1;
        }

        cryptoConnectedAt = 0;

        if (code === 1000) {
            if (now - lastNormalCloseLogAt >= NORMAL_CLOSE_LOG_THROTTLE_MS) {
                logger.info('Binance WS closed normally (code 1000).');
                lastNormalCloseLogAt = now;
            }
        } else {
            const shouldLogCloseCode =
                lastCloseCodeLogged !== code ||
                now - lastCloseCodeLogAt >= CLOSE_CODE_LOG_THROTTLE_MS;

            if (shouldLogCloseCode) {
                logger.warn(`Binance WS closed with code ${code}.`);
                lastCloseCodeLogged = code;
                lastCloseCodeLogAt = now;
            }
        }

        scheduleCryptoReconnect();
    });

    cryptoSocket.on('error', (err) => {
        const message = err?.message || 'Unknown websocket error';
        const key = message.toLowerCase();
        const now = Date.now();
        const shouldLogError = key !== lastWsErrorKey || now - lastWsErrorLogAt >= WS_ERROR_LOG_THROTTLE_MS;

        if (shouldLogError) {
            logger.warn(`Binance WS error: ${message}`);
            lastWsErrorKey = key;
            lastWsErrorLogAt = now;
        }
    });
};

const startTickerInterval = () => {
    if (tickerInterval) {
        return;
    }

    tickerInterval = setInterval(() => {
        if (!io) return;

        const domesticIndices = [
            { name: "NIFTY", value: (22500 + Math.random() * 50 - 25).toFixed(2), change: "+0.5%" },
            { name: "SENSEX", value: (74200 + Math.random() * 100 - 50).toFixed(2), change: "+0.4%" },
            { name: "BANKNIFTY", value: (48000 + Math.random() * 80 - 40).toFixed(2), change: "-0.2%" },
            { name: "INDIA VIX", value: (13.5 + Math.random() * 0.2 - 0.1).toFixed(2), change: "-1.5%" }
        ];

        io.to('ticker').emit('indexUpdate', domesticIndices);
    }, 5000);
};

module.exports = { initRealtimeService };
