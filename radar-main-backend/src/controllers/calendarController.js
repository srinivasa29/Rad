const { fetchLiveEconomicEvents } = require('../services/economicCalendarService');

const shiftDate = (days) => {
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next.toISOString().slice(0, 10);
};

const toIsoDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const year = normalized.getFullYear();
    const month = String(normalized.getMonth() + 1).padStart(2, '0');
    const day = String(normalized.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const todayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

const toNextBusinessDay = (date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    while (isWeekend(next)) {
        next.setDate(next.getDate() + 1);
    }
    return next;
};

const toPreviousBusinessDay = (date) => {
    const prev = new Date(date);
    prev.setHours(0, 0, 0, 0);
    while (isWeekend(prev)) {
        prev.setDate(prev.getDate() - 1);
    }
    return prev;
};

const nextMonthlyDay = (dayOfMonth) => {
    const today = todayStart();
    let candidate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);

    if (candidate < today) {
        candidate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
    }

    return candidate;
};

const nthWeekdayOfMonth = (year, monthIndex, weekday, nth) => {
    const first = new Date(year, monthIndex, 1);
    const firstOffset = (weekday - first.getDay() + 7) % 7;
    const day = 1 + firstOffset + ((nth - 1) * 7);
    return new Date(year, monthIndex, day);
};

const firstWeekdayOfMonth = (year, monthIndex, weekday) => {
    return nthWeekdayOfMonth(year, monthIndex, weekday, 1);
};

const nextEventFromMonthRule = (monthIndexes, ruleFn) => {
    const today = todayStart();
    const year = today.getFullYear();
    const candidates = [];

    for (const monthIndex of monthIndexes) {
        candidates.push(ruleFn(year, monthIndex));
        candidates.push(ruleFn(year + 1, monthIndex));
    }

    const upcoming = candidates
        .map((date) => {
            const normalized = new Date(date);
            normalized.setHours(0, 0, 0, 0);
            return normalized;
        })
        .filter((date) => date >= today)
        .sort((a, b) => a - b);

    return upcoming[0] || candidates[0];
};

const nextRbiPolicyDate = () => {
    const rbiMonths = [1, 3, 5, 7, 9, 11];
    return nextEventFromMonthRule(rbiMonths, (year, monthIndex) => firstWeekdayOfMonth(year, monthIndex, 5));
};

const nextFedDecisionDate = () => {
    const fomcMonths = [0, 2, 4, 5, 6, 8, 10, 11];
    return nextEventFromMonthRule(fomcMonths, (year, monthIndex) => nthWeekdayOfMonth(year, monthIndex, 3, 3));
};

const nextEcbPolicyDate = () => {
    const allMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    return nextEventFromMonthRule(allMonths, (year, monthIndex) => firstWeekdayOfMonth(year, monthIndex, 4));
};

const nextBoePolicyDate = () => {
    const allMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    return nextEventFromMonthRule(allMonths, (year, monthIndex) => firstWeekdayOfMonth(year, monthIndex, 4));
};

const nextBojOutlookDate = () => {
    const bojMonths = [0, 3, 6, 9];
    return nextEventFromMonthRule(bojMonths, (year, monthIndex) => nthWeekdayOfMonth(year, monthIndex, 2, 2));
};

const nextIndiaQuarterlyGdpDate = () => {
    const today = todayStart();
    const year = today.getFullYear();

    const candidates = [
        new Date(year, 1, 28),
        new Date(year, 4, 31),
        new Date(year, 7, 31),
        new Date(year, 10, 30),
        new Date(year + 1, 1, 28),
    ].map((date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    });

    const upcoming = candidates.filter((date) => date >= today).sort((a, b) => a - b);
    return toPreviousBusinessDay(upcoming[0] || candidates[0]);
};

const nextIndiaCpiDate = () => toNextBusinessDay(nextMonthlyDay(12));
const nextIndiaIipDate = () => toNextBusinessDay(nextMonthlyDay(12));
const nextUsCpiDate = () => toNextBusinessDay(nextMonthlyDay(12));
const nextUsRetailSalesDate = () => toNextBusinessDay(nextMonthlyDay(15));

const normalizeEventKey = (event) => {
    return String(event || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

const mergeEvents = (primary, fallback, limit = 8) => {
    const seen = new Set();
    const merged = [];

    const addEvent = (item) => {
        const key = `${String(item.country || '').toUpperCase()}|${normalizeEventKey(item.event)}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        merged.push(item);
    };

    primary.forEach(addEvent);
    fallback.forEach(addEvent);

    return merged
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, limit);
};

const toModeledEvent = (event) => ({
    ...event,
    forecast: null,
    previous: null,
    actual: null,
    source: 'modeled_schedule',
    factual: false,
});

const DEFAULT_MARKET_REGION = String(process.env.DEFAULT_MARKET_REGION || 'IN').toUpperCase();

const getCorporateActions = (req, res) => {
    if (DEFAULT_MARKET_REGION === 'US') {
        return res.json([
            { date: shiftDate(3), symbol: 'AAPL', action: 'Dividend', details: '$0.26/share' },
            { date: shiftDate(6), symbol: 'NVDA', action: 'Earnings', details: 'Quarterly results' },
            { date: shiftDate(12), symbol: 'TSLA', action: 'AGM', details: 'Annual General Meeting' },
        ]);
    }

    res.json([
        { date: shiftDate(2), symbol: 'RELIANCE.NS', action: 'Dividend', details: 'Rs 9.00/share' },
        { date: shiftDate(5), symbol: 'TCS.NS', action: 'Earnings', details: 'Quarterly results' },
        { date: shiftDate(9), symbol: 'HDFCBANK.NS', action: 'Board Meeting', details: 'Capital and guidance update' },
        { date: shiftDate(13), symbol: 'INFY.NS', action: 'AGM', details: 'Annual General Meeting' },
    ]);
};

const getEconomicEvents = async (req, res) => {
    try {
        const region = String(req.query.region || DEFAULT_MARKET_REGION).toUpperCase();

        if (region === 'US') {
            const usEvents = [
                { date: toIsoDate(nextFedDecisionDate()), country: 'US', event: 'Fed Interest Rate Decision', impact: 'High', forecast: '5.25%', previous: '5.25%' },
                { date: toIsoDate(nextUsCpiDate()), country: 'US', event: 'US CPI Data Release', impact: 'High', forecast: '3.1%', previous: '3.2%' },
                { date: toIsoDate(nextEventFromMonthRule([0, 3, 6, 9], (y, m) => nthWeekdayOfMonth(y, m, 4, 4))), country: 'US', event: 'US GDP Growth Estimate', impact: 'Medium', forecast: '2.2%', previous: '2.0%' },
                { date: toIsoDate(nextEventFromMonthRule([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], (y, m) => nthWeekdayOfMonth(y, m, 5, 1))), country: 'US', event: 'US Non-Farm Payrolls', impact: 'High', forecast: '194K', previous: '188K' },
                { date: toIsoDate(nextEcbPolicyDate()), country: 'EU', event: 'ECB Policy Statement', impact: 'High', forecast: '4.00%', previous: '4.00%' },
                { date: toIsoDate(nextBoePolicyDate()), country: 'GB', event: 'BoE Rate Decision', impact: 'High', forecast: '5.00%', previous: '5.00%' },
                { date: toIsoDate(nextBojOutlookDate()), country: 'JP', event: 'BoJ Outlook Report', impact: 'Medium', forecast: '-', previous: '-' },
                { date: toIsoDate(nextUsRetailSalesDate()), country: 'US', event: 'US Retail Sales', impact: 'Medium', forecast: '0.4%', previous: '0.2%' },
            ];

            const modeledUsEvents = usEvents.map(toModeledEvent);

            const liveEvents = await fetchLiveEconomicEvents({ region, limit: 12 });
            const merged = mergeEvents(liveEvents, modeledUsEvents, 8);
            return res.json(merged);
        }

        const inEvents = [
            { date: toIsoDate(nextRbiPolicyDate()), country: 'IN', event: 'RBI Monetary Policy Statement', impact: 'High', forecast: '6.50%', previous: '6.50%' },
            { date: toIsoDate(nextIndiaCpiDate()), country: 'IN', event: 'India CPI Inflation', impact: 'High', forecast: '5.1%', previous: '5.2%' },
            { date: toIsoDate(nextIndiaIipDate()), country: 'IN', event: 'IIP Industrial Output', impact: 'Medium', forecast: '4.4%', previous: '4.2%' },
            { date: toIsoDate(nextIndiaQuarterlyGdpDate()), country: 'IN', event: 'India GDP Growth Estimate', impact: 'High', forecast: '6.8%', previous: '6.7%' },
            { date: toIsoDate(nextFedDecisionDate()), country: 'US', event: 'Fed Interest Rate Decision', impact: 'High', forecast: '5.25%', previous: '5.25%' },
            { date: toIsoDate(nextEcbPolicyDate()), country: 'EU', event: 'ECB Policy Statement', impact: 'High', forecast: '4.00%', previous: '4.00%' },
            { date: toIsoDate(nextBoePolicyDate()), country: 'GB', event: 'BoE Rate Decision', impact: 'High', forecast: '5.00%', previous: '5.00%' },
            { date: toIsoDate(nextBojOutlookDate()), country: 'JP', event: 'BoJ Outlook Report', impact: 'Medium', forecast: '-', previous: '-' },
        ];

        const modeledInEvents = inEvents.map(toModeledEvent);

        const liveEvents = await fetchLiveEconomicEvents({ region, limit: 12 });
        const merged = mergeEvents(liveEvents, modeledInEvents, 8);
        res.json(merged);
    } catch (error) {
        console.error('Economic calendar fallback triggered:', error.message);

        const safeFallback = [
            { date: toIsoDate(nextRbiPolicyDate()), country: 'IN', event: 'RBI Monetary Policy Statement', impact: 'High', forecast: '6.50%', previous: '6.50%' },
            { date: toIsoDate(nextIndiaCpiDate()), country: 'IN', event: 'India CPI Inflation', impact: 'High', forecast: '5.1%', previous: '5.2%' },
            { date: toIsoDate(nextFedDecisionDate()), country: 'US', event: 'Fed Interest Rate Decision', impact: 'High', forecast: '5.25%', previous: '5.25%' },
            { date: toIsoDate(nextEcbPolicyDate()), country: 'EU', event: 'ECB Policy Statement', impact: 'High', forecast: '4.00%', previous: '4.00%' },
        ].map(toModeledEvent);

        res.json(safeFallback);
    }
};

module.exports = { getCorporateActions, getEconomicEvents };
