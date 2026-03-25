const axios = require('axios');

const BINANCE_BASE_URL = 'https://api.binance.com';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';
const DEFAULT_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT'];

const PAIR_META = {
    BTCUSDT: { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    ETHUSDT: { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    SOLUSDT: { id: 'solana', symbol: 'sol', name: 'Solana' },
    XRPUSDT: { id: 'ripple', symbol: 'xrp', name: 'XRP' },
    BNBUSDT: { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
};

const toBinancePair = (value = 'BTC') => {
    const normalized = String(value).trim().toUpperCase();
    const aliasMap = {
        BTC: 'BTCUSDT',
        BITCOIN: 'BTCUSDT',
        ETH: 'ETHUSDT',
        ETHEREUM: 'ETHUSDT',
        SOL: 'SOLUSDT',
        SOLANA: 'SOLUSDT',
        XRP: 'XRPUSDT',
        RIPPLE: 'XRPUSDT',
        BNB: 'BNBUSDT',
        BINANCECOIN: 'BNBUSDT',
    };

    if (aliasMap[normalized]) {
        return aliasMap[normalized];
    }

    if (normalized.endsWith('USDT')) {
        return normalized;
    }

    return `${normalized}USDT`;
};

const toBinanceInterval = (interval = '1D') => {
    const key = String(interval).toUpperCase();
    const map = {
        '1M': { interval: '4h', limit: 180 },
        '1W': { interval: '1h', limit: 168 },
        '1D': { interval: '15m', limit: 96 },
        '4H': { interval: '15m', limit: 64 },
        '1H': { interval: '5m', limit: 60 },
    };
    return map[key] || { interval: '1h', limit: 120 };
};

const fetchCryptoData = async () => {
    try {
        const response = await axios.get(`${BINANCE_BASE_URL}/api/v3/ticker/24hr`, {
            params: { symbols: JSON.stringify(DEFAULT_PAIRS) },
            timeout: 5000,
        });

        return response.data.map((ticker) => {
            const meta = PAIR_META[ticker.symbol] || {
                id: ticker.symbol.toLowerCase(),
                symbol: ticker.symbol.replace('USDT', '').toLowerCase(),
                name: ticker.symbol,
            };

            const currentPrice = Number(ticker.lastPrice);
            const change24h = Number(ticker.priceChangePercent);
            const quoteVolume = Number(ticker.quoteVolume);

            return {
                id: meta.id,
                symbol: meta.symbol,
                name: meta.name,
                current_price: Number.isFinite(currentPrice) ? currentPrice : 0,
                price_change_percentage_24h: Number.isFinite(change24h) ? change24h : 0,
                market_cap: null,
                total_volume: Number.isFinite(quoteVolume) ? quoteVolume : 0,
                image: null,
            details: {
                sector: "Blockchain",
                    market_cap: "N/A",
                    about: `${meta.name} market data sourced from Binance.`,
                    volume: Number.isFinite(quoteVolume) ? `$${(quoteVolume / 1e6).toFixed(2)}M` : 'N/A',
            }
            };
        });
    } catch (error) {
        console.error('Binance crypto fetch failed, trying CoinGecko:', error.message);
        try {
            const ids = Object.values(PAIR_META).map((item) => item.id).join(',');
            const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
                params: {
                    vs_currency: 'usd',
                    ids,
                    order: 'market_cap_desc',
                    per_page: 20,
                    page: 1,
                    sparkline: false,
                    price_change_percentage: '24h',
                },
                timeout: 6000,
                headers: process.env.COINGECKO_API_KEY
                    ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
                    : undefined,
            });

            const rows = Array.isArray(response.data) ? response.data : [];
            return rows.map((coin) => ({
                id: coin.id,
                symbol: String(coin.symbol || '').toLowerCase(),
                name: coin.name,
                current_price: Number(coin.current_price) || 0,
                price_change_percentage_24h: Number(coin.price_change_percentage_24h) || 0,
                market_cap: Number(coin.market_cap) || null,
                total_volume: Number(coin.total_volume) || 0,
                image: coin.image || null,
                details: {
                    sector: 'Blockchain',
                    market_cap: Number(coin.market_cap) > 0 ? `$${(Number(coin.market_cap) / 1e9).toFixed(2)}B` : 'N/A',
                    about: `${coin.name} market data sourced from CoinGecko.`,
                    volume: Number(coin.total_volume) > 0 ? `$${(Number(coin.total_volume) / 1e6).toFixed(2)}M` : 'N/A',
                }
            }));
        } catch (fallbackError) {
            console.error('CoinGecko crypto fetch failed, trying CoinMarketCap:', fallbackError.message);
            if (!process.env.COINMARKETCAP_API_KEY) {
                return [];
            }
            try {
                const response = await axios.get(`${COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest`, {
                    params: {
                        symbol: 'BTC,ETH,SOL,XRP,BNB',
                        convert: 'USD',
                    },
                    timeout: 7000,
                    headers: {
                        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
                    },
                });

                const data = response.data?.data || {};
                const order = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB'];
                return order
                    .map((sym) => {
                        const row = data[sym];
                        const quote = row?.quote?.USD;
                        if (!row || !quote) {
                            return null;
                        }

                        return {
                            id: String(row.slug || sym).toLowerCase(),
                            symbol: String(row.symbol || sym).toLowerCase(),
                            name: row.name || sym,
                            current_price: Number(quote.price) || 0,
                            price_change_percentage_24h: Number(quote.percent_change_24h) || 0,
                            market_cap: Number(quote.market_cap) || null,
                            total_volume: Number(quote.volume_24h) || 0,
                            image: null,
                            details: {
                                sector: 'Blockchain',
                                market_cap: Number(quote.market_cap) > 0 ? `$${(Number(quote.market_cap) / 1e9).toFixed(2)}B` : 'N/A',
                                about: `${row.name || sym} market data sourced from CoinMarketCap.`,
                                volume: Number(quote.volume_24h) > 0 ? `$${(Number(quote.volume_24h) / 1e6).toFixed(2)}M` : 'N/A',
                            }
                        };
                    })
                    .filter(Boolean);
            } catch (cmcError) {
                console.error('CoinMarketCap crypto fetch failed:', cmcError.message);
                return [];
            }
        }
    }
};

const fetchCryptoHistory = async (symbol, interval) => {
    try {
        const pair = toBinancePair(symbol);
        const timeConfig = toBinanceInterval(interval);
        const response = await axios.get(`${BINANCE_BASE_URL}/api/v3/klines`, {
            params: {
                symbol: pair,
                interval: timeConfig.interval,
                limit: timeConfig.limit,
            },
            timeout: 5000,
        });

        return response.data.map((candle) => ({
            date: new Date(candle[0]).toLocaleString(),
            price: Number(candle[4]),
        }));
    } catch (error) {
        console.error('Binance crypto history fetch failed, trying CoinGecko:', error.message);
        try {
            const pair = toBinancePair(symbol);
            const coinId = PAIR_META[pair]?.id || String(symbol || '').toLowerCase();
            const daysMap = {
                '1D': 1,
                '1W': 7,
                '1M': 30,
                '3M': 90,
                '6M': 180,
                '1Y': 365,
            };
            const days = daysMap[String(interval || '1M').toUpperCase()] || 30;

            const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}/market_chart`, {
                params: {
                    vs_currency: 'usd',
                    days,
                    interval: days <= 1 ? 'hourly' : 'daily',
                },
                timeout: 6000,
                headers: process.env.COINGECKO_API_KEY
                    ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
                    : undefined,
            });

            const prices = Array.isArray(response.data?.prices) ? response.data.prices : [];
            return prices.map((point) => ({
                date: new Date(point[0]).toLocaleString(),
                price: Number(point[1]),
            })).filter((item) => Number.isFinite(item.price));
        } catch (fallbackError) {
            console.error('CoinGecko crypto history fetch failed:', fallbackError.message);
            return [];
        }
    }
};

const fetchOrderBook = async (symbol) => {
    try {
        const pair = toBinancePair(symbol);
        const response = await axios.get(`${BINANCE_BASE_URL}/api/v3/depth`, {
            params: { symbol: pair, limit: 10 },
            timeout: 5000,
        });

        return {
            bids: response.data.bids || [],
            asks: response.data.asks || [],
        };
    } catch (error) {
        console.error('Binance order book fetch failed:', error.message);
        return null;
    }
};

module.exports = { fetchCryptoData, fetchCryptoHistory, fetchOrderBook };
