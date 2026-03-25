/**
 * Manual script to backfill historical data for Indian stocks
 * Run this script once to populate the database with historical data
 * 
 * Usage:
 *   node src/utils/runBackfill.js
 * 
 * Or with options:
 *   node src/utils/runBackfill.js --timeframe=1d --range=1y
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { connectDB } = require('../config/db');
const historicalDataBackfillService = require('../services/historicalDataBackfillService');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    timeframe: '1d', // Default: daily data
    range: '1y',     // Default: 1 year
};

args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    if (key && value) {
        options[key] = value;
    }
});

const runBackfill = async () => {
    try {
        logger.info('='.repeat(60));
        logger.info('RADAR - Historical Data Backfill');
        logger.info('='.repeat(60));
        logger.info(`Timeframe: ${options.timeframe}`);
        logger.info(`Range: ${options.range}`);
        logger.info('='.repeat(60));

        // Connect to MongoDB
        logger.info('Connecting to MongoDB...');
        const connected = await connectDB();

        if (!connected) {
            logger.error('Failed to connect to MongoDB');
            process.exit(1);
        }

        logger.info('✅ MongoDB connected');
        logger.info('');

        // Run backfill for Nifty 50
        logger.info('📊 Starting Nifty 50 backfill...');
        const startTime = Date.now();

        const results = await historicalDataBackfillService.backfillTopIndianStocks(
            options.timeframe,
            options.range
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Display results
        logger.info('');
        logger.info('='.repeat(60));
        logger.info('BACKFILL COMPLETE');
        logger.info('='.repeat(60));
        logger.info(`Duration: ${duration} seconds`);
        logger.info(`✅ Success: ${results.totalSuccess} symbols`);
        logger.info(`❌ Failed: ${results.totalFailed} symbols`);
        logger.info(`⏭️ Skipped: ${results.totalSkipped} symbols`);
        logger.info('='.repeat(60));

        if (results.nifty50.failed.length > 0) {
            logger.info('');
            logger.info('Failed symbols:');
            results.nifty50.failed.forEach(({ symbol, reason }) => {
                logger.info(`  ❌ ${symbol}: ${reason}`);
            });
        }

        logger.info('');
        logger.info('✅ Backfill process completed successfully');
        logger.info('You can now use /api/ohlc endpoints to fetch historical data');
        logger.info('');

        // Close MongoDB connection
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        
        process.exit(0);
    } catch (error) {
        logger.error(`Fatal error during backfill: ${error.message}`);
        logger.error(error.stack);
        
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        
        process.exit(1);
    }
};

// Run the backfill
runBackfill();
