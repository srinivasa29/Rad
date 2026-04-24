const mongoose = require('mongoose');
const logger = require('./logger');



const setupTimeSeriesCollection = async () => {
    try {
        const db = mongoose.connection.db;
        
        const collections = await db.listCollections({ name: 'ohlcs' }).toArray();
        
        if (collections.length > 0) {
            logger.info('Time-series collection "ohlcs" already exists');
            return true;
        }

        await db.createCollection('ohlcs', {
            timeseries: {
                timeField: 'timestamp',
                metaField: 'symbol',
                granularity: 'hours',
            },
            expireAfterSeconds: 31536000, // 1 year retention
        });

        logger.info('âœ… Time-series collection "ohlcs" created successfully');

        const collection = db.collection('ohlcs');
        
        await collection.createIndex(
            { symbol: 1, exchange: 1, timeframe: 1, timestamp: -1 },
            { name: 'symbol_exchange_timeframe_time' }
        );

        logger.info('âœ… Indexes created for time-series collection');
        
        return true;
    } catch (error) {
        logger.error(`Failed to setup time-series collection: ${error.message}`);
        return false;
    }
};

module.exports = { setupTimeSeriesCollection };
