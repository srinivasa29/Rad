const OHLC = require('../models/OHLC');
const logger = require('../config/logger');



class OHLCService {
    
    async bulkInsertOHLC(dataArray) {
        try {
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                return { success: false, message: 'No data provided' };
            }

            const result = await OHLC.insertMany(dataArray, { ordered: false });
            
            logger.info(`âœ… Inserted ${result.length} OHLC records`);
            
            return {
                success: true,
                count: result.length,
                message: `Successfully inserted ${result.length} records`,
            };
        } catch (error) {
            if (error.code === 11000) {
                logger.warn('Some OHLC records already exist, skipping duplicates');
                return {
                    success: true,
                    count: error.result?.nInserted || 0,
                    message: 'Inserted new records, skipped duplicates',
                };
            }

            logger.error(`Error inserting OHLC data: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    
    async getOHLCData({
        symbol,
        exchange = 'NSE',
        timeframe = '1d',
        startDate = null,
        endDate = null,
        limit = 365,
    }) {
        try {
            const query = {
                symbol: symbol.toUpperCase(),
                exchange: exchange.toUpperCase(),
                timeframe,
            };

            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = new Date(startDate);
                if (endDate) query.timestamp.$lte = new Date(endDate);
            }

            const data = await OHLC.find(query)
                .sort({ timestamp: -1 }) // Most recent first
                .limit(limit)
                .lean();

            logger.info(`Retrieved ${data.length} OHLC records for ${symbol}`);

            return {
                success: true,
                count: data.length,
                data: data.reverse(), // Return oldest first
            };
        } catch (error) {
            logger.error(`Error retrieving OHLC data: ${error.message}`);
            return {
                success: false,
                message: error.message,
                data: [],
            };
        }
    }

    
    async getLatestOHLC(symbol, exchange = 'NSE', timeframe = '1d') {
        try {
            const data = await OHLC.findOne({
                symbol: symbol.toUpperCase(),
                exchange: exchange.toUpperCase(),
                timeframe,
            })
                .sort({ timestamp: -1 })
                .lean();

            return {
                success: true,
                data,
            };
        } catch (error) {
            logger.error(`Error retrieving latest OHLC: ${error.message}`);
            return {
                success: false,
                data: null,
            };
        }
    }

    
    async getLatest(symbol, timeframe = '1d', exchange = 'NSE') {
        return this.getLatestOHLC(symbol, exchange, timeframe);
    }

    
    async saveOHLC(ohlcData) {
        try {
            const record = new OHLC(ohlcData);
            await record.save();
            
            return {
                success: true,
                data: record,
            };
        } catch (error) {
            if (error.code === 11000) {
                return {
                    success: true,
                    message: 'Record already exists',
                };
            }

            logger.error(`Error saving OHLC record: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    
    async hasData(symbol, exchange, timeframe, startDate, endDate) {
        try {
            const count = await OHLC.countDocuments({
                symbol: symbol.toUpperCase(),
                exchange: exchange.toUpperCase(),
                timeframe,
                timestamp: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            });

            return count > 0;
        } catch (error) {
            logger.error(`Error checking OHLC data existence: ${error.message}`);
            return false;
        }
    }

    
    async deleteOldData(daysOld = 365) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await OHLC.deleteMany({
                timestamp: { $lt: cutoffDate },
            });

            logger.info(`Deleted ${result.deletedCount} old OHLC records`);

            return {
                success: true,
                deletedCount: result.deletedCount,
            };
        } catch (error) {
            logger.error(`Error deleting old OHLC data: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    
    async getAvailableSymbols(exchange = null) {
        try {
            const match = exchange ? { exchange: exchange.toUpperCase() } : {};
            
            const symbols = await OHLC.distinct('symbol', match);

            return {
                success: true,
                count: symbols.length,
                symbols,
            };
        } catch (error) {
            logger.error(`Error getting available symbols: ${error.message}`);
            return {
                success: false,
                symbols: [],
            };
        }
    }
}

module.exports = new OHLCService();
