const { fetchSymbolData } = require('../services/marketAggregator');

const getWatchlistData = async (req, res) => {
    try {
        const symbolsParam = req.query.symbols || req.query.symbol || '';
        const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);
        if (!symbols.length) return res.json({ data: [] });
        const promises = symbols.map(s => fetchSymbolData(s, { userId: req.user?._id }));
        const rows = await Promise.all(promises);
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getWatchlistData };
