const axios = require('axios');
const { generateHistory } = require('../utils/mockGenerator');
const logger = require('../utils/logger');
const TWELVE_DATA_KEY = process.env.TWELVEDATA_API_KEY || process.env.TWELVE_DATA_API_KEY;

const parseForexSymbol = (symbol = '') => {
    const cleaned = String(symbol).toUpperCase().replace(/[^A-Z]/g, '');
    if (cleaned.length >= 6) {
        const base = cleaned.slice(0, 3);
        const quote = cleaned.slice(3, 6);
        return { base, quote };
    }

    return { base: 'EUR', quote: 'USD' };
};

const toExchangeRatePair = (symbol = '') => {
    const { base, quote } = parseForexSymbol(symbol);
    return { base, quote };
};

const fetchForexData = async () => {
    try {
        const res = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY');
        const rates = res.data.rates;

        return [
            { 
                ticker: 'EUR/USD', 
                name: 'Euro / US Dollar', 
                bid: parseFloat((1 / rates.EUR).toFixed(4)), 
                ask: parseFloat(((1 / rates.EUR) + 0.0002).toFixed(4)), 
                change: 0.15, 
                type: 'FOREX',
                details: {
                    sector: "Currency",
                    market_cap: "N/A", 
                    about: "The most traded currency pair in the world, representing the Eurozone and USA economies.",
                    yield: "3.5%"
                }
            },
            { 
                ticker: 'GBP/USD', 
                name: 'British Pound / US Dollar', 
                bid: parseFloat((1 / rates.GBP).toFixed(4)), 
                ask: parseFloat(((1 / rates.GBP) + 0.0002).toFixed(4)),
                change: -0.20,
                type: 'FOREX',
                details: {
                    sector: "Currency",
                    market_cap: "N/A",
                    about: "A major currency pair often referred to as 'The Cable'.",
                    yield: "5.25%"
                }
            },
            { 
                ticker: 'USD/JPY', 
                name: 'US Dollar / Japanese Yen', 
                bid: parseFloat(rates.JPY.toFixed(2)), 
                ask: parseFloat((rates.JPY + 0.04).toFixed(2)),
                change: 0.55,
                type: 'FOREX',
                details: {
                    sector: "Currency",
                    market_cap: "N/A",
                    about: "A measure of the value of the US Dollar relative to the Japanese Yen.",
                    yield: "0.1%"
                }
            }
        ];
    } catch (error) {
        logger.warn('Frankfurter forex fetch failed, trying ExchangeRate API...', { error: error.message });
        if (process.env.EXCHANGERATE_API_KEY) {
            try {
                const key = process.env.EXCHANGERATE_API_KEY;
                const baseResponse = await axios.get(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`, { timeout: 6000 });
                const rates = baseResponse.data?.conversion_rates || {};
                const eur = Number(rates.EUR);
                const gbp = Number(rates.GBP);
                const jpy = Number(rates.JPY);

                const rows = [
                    {
                        ticker: 'EUR/USD',
                        name: 'Euro / US Dollar',
                        bid: Number.isFinite(eur) && eur > 0 ? Number((1 / eur).toFixed(4)) : NaN,
                        ask: Number.isFinite(eur) && eur > 0 ? Number(((1 / eur) + 0.0002).toFixed(4)) : NaN,
                        change: 0,
                        type: 'FOREX',
                        details: { sector: 'Currency', market_cap: 'N/A', about: 'EUR/USD sourced from ExchangeRate API.', yield: 'N/A' }
                    },
                    {
                        ticker: 'GBP/USD',
                        name: 'British Pound / US Dollar',
                        bid: Number.isFinite(gbp) && gbp > 0 ? Number((1 / gbp).toFixed(4)) : NaN,
                        ask: Number.isFinite(gbp) && gbp > 0 ? Number(((1 / gbp) + 0.0002).toFixed(4)) : NaN,
                        change: 0,
                        type: 'FOREX',
                        details: { sector: 'Currency', market_cap: 'N/A', about: 'GBP/USD sourced from ExchangeRate API.', yield: 'N/A' }
                    },
                    {
                        ticker: 'USD/JPY',
                        name: 'US Dollar / Japanese Yen',
                        bid: Number.isFinite(jpy) ? Number(jpy.toFixed(2)) : NaN,
                        ask: Number.isFinite(jpy) ? Number((jpy + 0.04).toFixed(2)) : NaN,
                        change: 0,
                        type: 'FOREX',
                        details: { sector: 'Currency', market_cap: 'N/A', about: 'USD/JPY sourced from ExchangeRate API.', yield: 'N/A' }
                    }
                ].filter((row) => Number.isFinite(row.bid) && Number.isFinite(row.ask));

                if (rows.length) {
                    return rows;
                }
            } catch (exError) {
                logger.warn('ExchangeRate API forex fetch failed, trying TwelveData...', { error: exError.message });
            }
        }

        if (!TWELVE_DATA_KEY) {
            return [];
        }

        try {
            const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY'];
            const quoteResults = await Promise.all(pairs.map(async (pair) => {
                const response = await axios.get('https://api.twelvedata.com/price', {
                    params: {
                        symbol: pair,
                        apikey: TWELVE_DATA_KEY,
                    },
                    timeout: 6000,
                });

                const price = Number(response.data?.price);
                return {
                    pair,
                    price: Number.isFinite(price) ? price : NaN,
                };
            }));

            return quoteResults
                .filter((row) => Number.isFinite(row.price))
                .map((row) => ({
                    ticker: row.pair,
                    name: row.pair === 'EUR/USD'
                        ? 'Euro / US Dollar'
                        : row.pair === 'GBP/USD'
                            ? 'British Pound / US Dollar'
                            : 'US Dollar / Japanese Yen',
                    bid: Number(row.price.toFixed(row.pair === 'USD/JPY' ? 2 : 4)),
                    ask: Number((row.price + (row.pair === 'USD/JPY' ? 0.04 : 0.0002)).toFixed(row.pair === 'USD/JPY' ? 2 : 4)),
                    change: 0,
                    type: 'FOREX',
                    details: {
                        sector: 'Currency',
                        market_cap: 'N/A',
                        about: `${row.pair} sourced from TwelveData.`,
                        yield: 'N/A',
                    }
                }));
        } catch (fallbackError) {
            logger.warn('TwelveData forex fetch failed.', { error: fallbackError.message });
            return [];
        }
    }
};

const fetchForexHistory = async (symbol, interval = '1D') => {
    try {
        const { base, quote } = parseForexSymbol(symbol);
        const from = quote;
        const to = base;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const dateString = startDate.toISOString().split('T')[0];

        const url = `https://api.frankfurter.app/${dateString}..?from=${from}&to=${to}`;
        const res = await axios.get(url);

        const history = Object.entries(res.data.rates)
            .map(([date, rates]) => ({
                date,
                price: Number(rates[to]),
            }))
            .filter((item) => Number.isFinite(item.price))
            .sort((a, b) => a.date.localeCompare(b.date));

        return history;

    } catch (error) {
        logger.warn('Frankfurter history failed, trying ExchangeRate API...', { error: error.message });
        if (process.env.EXCHANGERATE_API_KEY) {
            try {
                const key = process.env.EXCHANGERATE_API_KEY;
                const { base, quote } = toExchangeRatePair(symbol);
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 90);
                const response = await axios.get(`https://v6.exchangerate-api.com/v6/${key}/history/${base}/${start.toISOString().slice(0, 10)}/${end.toISOString().slice(0, 10)}`, {
                    timeout: 7000,
                });

                const rates = response.data?.conversion_rates || {};
                const history = Object.entries(rates)
                    .map(([date, row]) => ({
                        date,
                        price: Number(row?.[quote]),
                    }))
                    .filter((item) => Number.isFinite(item.price))
                    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

                if (history.length > 0) {
                    return history;
                }
            } catch (exError) {
                logger.warn('ExchangeRate API history fetch failed, trying TwelveData...', { error: exError.message });
            }
        }

        if (TWELVE_DATA_KEY) {
            try {
                const { base, quote } = parseForexSymbol(symbol);
                const pair = `${base}/${quote}`;
                const response = await axios.get('https://api.twelvedata.com/time_series', {
                    params: {
                        symbol: pair,
                        interval: '1day',
                        outputsize: 90,
                        apikey: TWELVE_DATA_KEY,
                    },
                    timeout: 7000,
                });

                const values = Array.isArray(response.data?.values) ? response.data.values : [];
                const history = values
                    .map((row) => ({
                        date: row.datetime,
                        price: Number(row.close),
                    }))
                    .filter((item) => Number.isFinite(item.price))
                    .reverse();

                if (history.length > 0) {
                    return history;
                }
            } catch (fallbackError) {
                logger.warn('TwelveData history fetch failed.', { error: fallbackError.message });
            }
        }

        logger.warn('Forex history unavailable, using mock history.');
        return generateHistory(1.08, 0.005, interval);
    }
};

module.exports = { fetchForexData, fetchForexHistory };
