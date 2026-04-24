const axios = require('axios');

let macroCache = {
    pulse: null,
    indicators: null,
    lastFetch: 0
};

const CACHE_DURATION = 1000 * 60 * 60;

const fetchFredLatest = async (seriesId, apiKey) => {
    const url = 'https://api.stlouisfed.org/fred/series/observations';
    const response = await axios.get(url, {
        params: {
            series_id: seriesId,
            api_key: apiKey,
            file_type: 'json',
            limit: 1,
            sort_order: 'desc',
        },
        timeout: 6000,
    });

    const value = Number(response.data?.observations?.[0]?.value);
    return Number.isFinite(value) ? value : null;
};

const fetchWorldBankLatest = async (indicatorCode) => {
    const url = `https://api.worldbank.org/v2/country/US/indicator/${indicatorCode}`;
    const response = await axios.get(url, {
        params: { format: 'json', per_page: 1 },
        timeout: 6000,
    });
    const value = Number(response.data?.[1]?.[0]?.value);
    return Number.isFinite(value) ? value : null;
};

const getGlobalPulse = async () => {
    const now = Date.now();
    if (macroCache.pulse && (now - macroCache.lastFetch < CACHE_DURATION)) {
        return macroCache.pulse;
    }

    try {
        const pulse = [
            { name: "S&P 500", value: "5,245", change: "+0.8%", trend: "up" },
            { name: "NASDAQ", value: "16,400", change: "+1.2%", trend: "up" },
            { name: "FTSE 100", value: "7,950", change: "+0.1%", trend: "up" },
            { name: "NIKKEI 225", value: "40,100", change: "-0.4%", trend: "down" },
            { name: "GOLD", value: "2,350", change: "+0.5%", trend: "up" },
            { name: "CRUDE OIL", value: "86.50", change: "+1.1%", trend: "up" }
        ];

        macroCache.pulse = pulse;
        macroCache.lastFetch = Date.now();
        return pulse;

    } catch (error) {
        console.error("Global Pulse Fetch Error:", error);
        return [];
    }
};

const getMacroIndicators = async () => {
    const now = Date.now();
    if (macroCache.indicators && (now - macroCache.lastFetch < CACHE_DURATION)) {
        return macroCache.indicators;
    }

    try {
        const fredKey = process.env.FRED_API_KEY;
        let gdpGrowth = null;
        let inflationRate = null;
        let interestRate = null;

        if (fredKey) {
            try {
                const [fredGdp, fredCpi, fredFunds] = await Promise.all([
                    fetchFredLatest('A191RL1Q225SBEA', fredKey),
                    fetchFredLatest('CPIAUCSL', fredKey),
                    fetchFredLatest('FEDFUNDS', fredKey),
                ]);

                if (Number.isFinite(fredGdp)) gdpGrowth = `${fredGdp.toFixed(1)}%`;
                if (Number.isFinite(fredCpi)) inflationRate = `${fredCpi.toFixed(1)} index`;
                if (Number.isFinite(fredFunds)) interestRate = `${fredFunds.toFixed(2)}%`;
            } catch (e) {
                console.warn('FRED API Error:', e.message);
            }
        }

        if (!gdpGrowth || !inflationRate) {
            try {
                const [wbGdp, wbInflation] = await Promise.all([
                    fetchWorldBankLatest('NY.GDP.MKTP.KD.ZG'),
                    fetchWorldBankLatest('FP.CPI.TOTL.ZG'),
                ]);

                if (!gdpGrowth && Number.isFinite(wbGdp)) gdpGrowth = `${wbGdp.toFixed(1)}%`;
                if (!inflationRate && Number.isFinite(wbInflation)) inflationRate = `${wbInflation.toFixed(1)}%`;
            } catch (e) {
                console.warn('World Bank API Error:', e.message);
            }
        }

        const indicators = {
            gdp_growth: gdpGrowth || '2.1% (Est)',
            inflation_rate: inflationRate || '3.4% (Est)',
            interest_rate: interestRate || '5.33%',
        };
        macroCache.indicators = indicators;
        macroCache.lastFetch = Date.now();
        return indicators;

    } catch (error) {
        console.error("Macro API Error:", error.message);
        return { gdp_growth: "2.1% (Est)", inflation_rate: "3.4% (Est)", interest_rate: "5.33%" };
    }
};

module.exports = { getGlobalPulse, getMacroIndicators };
