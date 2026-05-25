const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance();

const getLiveMarketData = async (symbol) => {
    try {
        const result = await yahooFinance.quote(symbol);

        return {
            success: true,
            data: {
                symbol: result.symbol,
                name: result.shortName,
                price: result.regularMarketPrice,
                change: result.regularMarketChange,
                changePercent: result.regularMarketChangePercent,
                open: result.regularMarketOpen,
                high: result.regularMarketDayHigh,
                low: result.regularMarketDayLow,
                previousClose: result.regularMarketPreviousClose,
                volume: result.regularMarketVolume,
                marketCap: result.marketCap,
                currency: result.currency,
                timestamp: result.regularMarketTime
            }
        };

    } catch (error) {
        try {
            const cleanSym = symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');
            const QuoteModel = require('../models/Quote');
            const dbQuote = await QuoteModel.findOne({ symbol: new RegExp(`^${cleanSym}$`, 'i') }).lean();
            if (dbQuote) {
                return {
                    success: true,
                    data: {
                        symbol: symbol,
                        name: dbQuote.shortName || dbQuote.longName || symbol,
                        price: dbQuote.price || 0,
                        change: 0,
                        changePercent: dbQuote.changePercent || 0,
                        open: dbQuote.price || 0,
                        high: dbQuote.price || 0,
                        low: dbQuote.price || 0,
                        previousClose: dbQuote.price || 0,
                        volume: dbQuote.volume || 0,
                        marketCap: dbQuote.marketCap || 0,
                        currency: dbQuote.currency || 'INR',
                        timestamp: dbQuote.updatedAt || new Date()
                    }
                };
            }
        } catch (dbError) {
            console.error('Database fallback failed in liveMarketService:', dbError);
        }
        return {
            success: false,
            message: error.message
        };
    }
};

module.exports = {
    getLiveMarketData
};