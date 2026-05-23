const Watchlist = require('../models/Watchlist');
const { getTechnicalIndicators } = require('../services/indicatorService');
const { detectPatterns } = require('../services/patternService');
const { fetchStockData } = require('../services/stockService');

const normalizeSym = (sym) => {
    let s = String(sym || '').trim().toUpperCase();
    if (!s) return s;
    if (s.includes('.')) return s;
    return `${s}.NS`;
};

// GET /api/research/watchlist-scans
const getWatchlistScans = async (req, res) => {
    try {
        let rawSymbols = [];
        if (req.user && req.user._id) {
            const watchlists = await Watchlist.find({ userId: req.user._id });
            watchlists.forEach(wl => {
                (wl.items || []).forEach(item => { if (item.symbol) rawSymbols.push(item.symbol); });
            });
        }

        if (rawSymbols.length === 0) {
            rawSymbols = ['RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK'];
        }

        const symbols = [...new Set(rawSymbols)].slice(0, 25).map(normalizeSym);
        const stocks = await fetchStockData(symbols).catch(()=>[]);
        const stockMap = {};
        (stocks||[]).forEach(s => { stockMap[String(s.symbol||'').replace('.NS','').toUpperCase()] = s; });

        const results = [];
        await Promise.all(symbols.map(async (sym) => {
            try {
                const clean = String(sym).replace('.NS','');
                const indicators = await getTechnicalIndicators('stock', sym, '1D', {});
                const patterns = await detectPatterns('stock', sym, {});
                const now = new Date().toISOString();

                // Build simple scan signals
                const signals = [];
                const price = indicators.lastPrice || (stockMap[clean] && stockMap[clean].price) || null;

                if (indicators.rsi && indicators.rsi > 60) signals.push('Momentum building');
                if (indicators.volumeStatus === 'high') signals.push('Volume spike');
                if (indicators.resistance && price && indicators.resistance > 0 && ((indicators.resistance - price) / indicators.resistance) <= 0.02) signals.push('Near breakout');
                if (patterns && patterns.length && patterns.some(p=>/reversal|double bottom|head and shoulders/i.test(p.pattern||p.name||''))) signals.push('Reversal setup');
                if (indicators.ema20 && indicators.ema50 && indicators.ema20 > indicators.ema50) signals.push('Trend continuation');

                results.push({ symbol: clean, price, signals: signals.length ? signals : ['No signal'], timestamp: now });
            } catch (err) {
                // On any failure return data unavailable marker
                results.push({ symbol: String(sym).replace('.NS',''), error: 'Data unavailable' });
            }
        }));

        res.json({ count: results.length, results });
    } catch (error) {
        console.error('Error in getWatchlistScans:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getWatchlistScans };
