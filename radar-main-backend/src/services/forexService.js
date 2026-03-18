const axios = require('axios');
const { generateHistory } = require('../utils/mockGenerator');

const parseForexSymbol = (symbol = '') => {
    const cleaned = String(symbol).toUpperCase().replace(/[^A-Z]/g, '');
    if (cleaned.length >= 6) {
        const base = cleaned.slice(0, 3);
        const quote = cleaned.slice(3, 6);
        return { base, quote };
    }

    return { base: 'EUR', quote: 'USD' };
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
        console.error("Frankfurter forex fetch failed, trying TwelveData:", error.message);
        if (!process.env.TWELVEDATA_API_KEY) {
            return [];
        }

        try {
            const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY'];
            const quoteResults = await Promise.all(pairs.map(async (pair) => {
                const response = await axios.get('https://api.twelvedata.com/price', {
                    params: {
                        symbol: pair,
                        apikey: process.env.TWELVEDATA_API_KEY,
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
            console.error('TwelveData forex fetch failed:', fallbackError.message);
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
        console.error("Frankfurter history failed, trying TwelveData:", error.message);
        if (process.env.TWELVEDATA_API_KEY) {
            try {
                const { base, quote } = parseForexSymbol(symbol);
                const pair = `${base}/${quote}`;
                const response = await axios.get('https://api.twelvedata.com/time_series', {
                    params: {
                        symbol: pair,
                        interval: '1day',
                        outputsize: 90,
                        apikey: process.env.TWELVEDATA_API_KEY,
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
                console.error('TwelveData history fetch failed:', fallbackError.message);
            }
        }

        console.error("Forex history unavailable, using Mock");
        return generateHistory(1.08, 0.005, interval);
    }
};

module.exports = { fetchForexData, fetchForexHistory };
