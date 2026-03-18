const axios = require('axios');

const DEFAULT_MARKET_REGION = String(process.env.DEFAULT_MARKET_REGION || 'IN').toUpperCase();
const NEWS_COUNTRY = String(process.env.NEWS_COUNTRY || (DEFAULT_MARKET_REGION === 'US' ? 'us' : 'in')).toLowerCase();

const mapArticle = (article) => ({
    id: article.url,
    source: article.source?.name || 'Unknown',
    title: article.title,
    time: new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    url: article.url,
    sentiment: 'Neutral',
});

const fetchMarketNews = async (category = 'general') => {
    try {
        if (process.env.GNEWS_API_KEY) {
            const url = 'https://gnews.io/api/v4/top-headlines';
            const params = {
                category: 'business',
                lang: 'en',
                country: NEWS_COUNTRY,
                apikey: process.env.GNEWS_API_KEY,
                max: 6
            };
            const response = await axios.get(url, { params });
            return (response.data.articles || []).map(mapArticle);
        }

        if (process.env.NEWS_API_KEY) {
            const url = 'https://newsapi.org/v2/top-headlines';
            const params = {
                category: 'business',
                language: 'en',
                country: NEWS_COUNTRY,
                apiKey: process.env.NEWS_API_KEY,
                pageSize: 6
            };
            const response = await axios.get(url, { params });
            return (response.data.articles || []).map(mapArticle);
        }

        return [
            {
                id: 1,
                source: "Reuters",
                title: "Global markets rally as inflation shows signs of cooling",
                time: "2h ago",
                sentiment: "Bullish",
                url: "#"
            },
            {
                id: 2,
                source: "Bloomberg",
                title: "Tech stocks face pressure ahead of earnings season",
                time: "4h ago",
                sentiment: "Bearish",
                url: "#"
            },
            {
                id: 3,
                source: "CNBC",
                title: "Fed signals potential rate cuts later this year",
                time: "5h ago",
                sentiment: "Bullish",
                url: "#"
            }
        ];

    } catch (error) {
        console.error("News API Error:", error.message);
        return [];
    }
};

module.exports = { fetchMarketNews };
