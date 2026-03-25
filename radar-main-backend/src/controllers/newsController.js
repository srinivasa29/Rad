const { fetchMarketNews } = require('../services/newsService');
const logger = require('../utils/logger');

const getMarketNews = async (req, res) => {
    try {
        const category = String(req.query.category || 'business');
        const symbol = String(req.query.symbol || '').trim();
        const limit = Number.parseInt(req.query.limit || '5', 10);
        const news = await fetchMarketNews(category, {
            symbol: symbol || undefined,
            limit: Number.isFinite(limit) ? limit : 5,
        });
        res.json(news);

    } catch (error) {
        logger.error('Market news fetch failed', {
            error: error.message,
            code: error.code,
        });
        res.status(500).json({ error: "Failed to fetch news" });
    }
};

module.exports = { getMarketNews };
