const axios = require('axios');

const DEFAULT_DAYS_AHEAD = Number.parseInt(process.env.MACRO_CALENDAR_DAYS_AHEAD || '90', 10);
const DEFAULT_PROVIDER = String(process.env.MACRO_CALENDAR_PROVIDER || 'FREE').toUpperCase();

const toIsoDate = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDaysIso = (baseDate, days) => {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + days);
    return toIsoDate(next);
};

const normalizeCountryCode = (country) => {
    const value = String(country || '').trim().toLowerCase();
    if (!value) return null;

    if (['india', 'in'].includes(value)) return 'IN';
    if (['united states', 'usa', 'us', 'united states of america'].includes(value)) return 'US';
    if (['euro area', 'european union', 'eu'].includes(value)) return 'EU';
    if (['united kingdom', 'uk', 'gb', 'great britain'].includes(value)) return 'GB';
    if (['japan', 'jp'].includes(value)) return 'JP';

    return null;
};

const toImpactLabel = (importance) => {
    const numeric = Number(importance);
    if (Number.isFinite(numeric)) {
        if (numeric >= 2) return 'High';
        if (numeric >= 1) return 'Medium';
        return 'Low';
    }

    const text = String(importance || '').toLowerCase();
    if (text.includes('high')) return 'High';
    if (text.includes('medium') || text.includes('moderate')) return 'Medium';
    if (text.includes('low')) return 'Low';
    return 'Medium';
};

const hasAnyKeyword = (value, keywords) => {
    const haystack = String(value || '').toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
};

const IMPORTANT_EVENT_KEYWORDS = [
    'cpi',
    'inflation',
    'industrial production',
    'iip',
    'gdp',
    'interest rate',
    'rate decision',
    'policy statement',
    'outlook report',
    'non-farm payroll',
    'retail sales',
    'monetary policy',
    'fomc',
    'ecb',
    'boe',
    'boj',
    'rbi',
];

const regionCountryPriority = (region) => {
    if (region === 'US') return ['US', 'EU', 'GB', 'JP', 'IN'];
    return ['IN', 'US', 'EU', 'GB', 'JP'];
};

const sortEvents = (events) => {
    return [...events].sort((a, b) => {
        const dateDiff = new Date(a.date) - new Date(b.date);
        if (dateDiff !== 0) return dateDiff;

        const impactWeight = { High: 0, Medium: 1, Low: 2 };
        const impactDiff = (impactWeight[a.impact] ?? 3) - (impactWeight[b.impact] ?? 3);
        if (impactDiff !== 0) return impactDiff;

        return String(a.event).localeCompare(String(b.event));
    });
};

const dedupeEvents = (events) => {
    const seen = new Set();
    const unique = [];

    for (const item of events) {
        const key = `${item.date}|${item.country}|${String(item.event).toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
    }

    return unique;
};

const fetchTradingEconomicsEvents = async (region, limit = 8, credentialOverride = null) => {
    const apiKey = credentialOverride || process.env.TRADING_ECONOMICS_KEY;
    if (!apiKey) return [];

    const today = new Date();
    const from = toIsoDate(today);
    const to = addDaysIso(today, Number.isFinite(DEFAULT_DAYS_AHEAD) ? DEFAULT_DAYS_AHEAD : 90);

    const response = await axios.get('https://api.tradingeconomics.com/calendar', {
        params: {
            c: apiKey,
            f: 'json',
            d1: from,
            d2: to,
        },
        timeout: 7000,
    });

    const rows = Array.isArray(response.data) ? response.data : [];
    const allowedCountries = new Set(regionCountryPriority(region));

    const mapped = rows
        .map((row) => {
            const eventName = row.Event || row.Category || row.Title || '';
            const countryCode = normalizeCountryCode(row.Country || row.CountryCode || row.country);

            if (!countryCode || !allowedCountries.has(countryCode)) {
                return null;
            }

            const date = toIsoDate(row.Date || row.date);
            if (!date) {
                return null;
            }

            return {
                date,
                country: countryCode,
                event: eventName,
                impact: toImpactLabel(row.Importance || row.importance),
                forecast: row.Forecast || row.forecast || '-',
                previous: row.Previous || row.previous || '-',
                actual: row.Actual || row.actual || '-',
                source: 'tradingeconomics',
                factual: true,
            };
        })
        .filter(Boolean);

    const keywordMatched = mapped.filter((item) => hasAnyKeyword(item.event, IMPORTANT_EVENT_KEYWORDS));
    const highImpactFallback = mapped.filter((item) => item.impact !== 'Low');
    const selected = keywordMatched.length > 0
        ? keywordMatched
        : (highImpactFallback.length > 0 ? highImpactFallback : mapped);

    const sorted = sortEvents(dedupeEvents(selected));
    return sorted.slice(0, limit);
};

const fetchFreeEconomicEvents = async (region, limit = 8) => {
    return fetchTradingEconomicsEvents(region, limit, 'guest:guest');
};

const fetchLiveEconomicEvents = async ({ region = 'IN', limit = 8 } = {}) => {
    const normalizedRegion = String(region || 'IN').toUpperCase();

    if (DEFAULT_PROVIDER === 'NONE') {
        return [];
    }

    try {
        if (DEFAULT_PROVIDER === 'FREE') {
            return await fetchFreeEconomicEvents(normalizedRegion, limit);
        }
        if (DEFAULT_PROVIDER === 'TRADING_ECONOMICS') {
            return await fetchTradingEconomicsEvents(normalizedRegion, limit);
        }
        return [];
    } catch (_error) {
        return [];
    }
};

module.exports = { fetchLiveEconomicEvents };
