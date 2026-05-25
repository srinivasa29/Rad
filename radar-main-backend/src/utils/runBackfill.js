

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { connectDB } = require('../config/db');
const historicalDataBackfillService = require('../services/historicalDataBackfillService');

const args = process.argv.slice(2);
const options = {
    timeframe: '1d', // Default: daily data
    range: '1y',     // Default: 1 year
    symbols: '',
    force: false,
    minCount: 0,
};

args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    if (!key) return;
    if (value === undefined) {
        options[key] = true;
        return;
    }
    options[key] = value;
});

const parseSymbols = (value) => String(value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const resolveExchange = (symbol) => {
    const upper = String(symbol || '').toUpperCase();
    if (upper.endsWith('.BO')) return 'BSE';
    if (upper.endsWith('.NS')) return 'NSE';
    if (upper.startsWith('^')) return 'NSE';
    return 'NSE';
};

const runBackfill = async () => {
    try {
        logger.info('='.repeat(60));
        logger.info('RADAR - Historical Data Backfill');
        logger.info('='.repeat(60));
        logger.info(`Timeframe: ${options.timeframe}`);
        logger.info(`Range: ${options.range}`);
        logger.info('='.repeat(60));

        logger.info('Connecting to MongoDB...');
        const connected = await connectDB();

        if (!connected) {
            logger.error('Failed to connect to MongoDB');
            process.exit(1);
        }

        logger.info('✅ MongoDB connected');
        logger.info('');

        const startTime = Date.now();

        const targetSymbols = parseSymbols(options.symbols);
        let results = null;

        if (targetSymbols.length > 0) {
            logger.info(`📊 Starting targeted backfill: ${targetSymbols.join(', ')}`);

            const summary = { success: [], failed: [], skipped: [], total: targetSymbols.length };
            for (let i = 0; i < targetSymbols.length; i++) {
                const symbol = targetSymbols[i];
                const exchange = resolveExchange(symbol);
                logger.info(`[${i + 1}/${targetSymbols.length}] Processing ${symbol}`);

                const result = await historicalDataBackfillService.backfillSymbol(
                    symbol,
                    exchange,
                    options.timeframe,
                    options.range,
                    {
                        force: String(options.force).toLowerCase() === 'true' || options.force === true,
                        minCount: Number(options.minCount) || 0,
                    }
                );

                if (result?.skipped) summary.skipped.push(symbol);
                else if (result?.success) summary.success.push({ symbol, count: result.count });
                else summary.failed.push({ symbol, reason: result?.message || 'Failed' });

                await new Promise(resolve => setTimeout(resolve, 300));
            }

            results = {
                nifty50: { success: summary.success, failed: summary.failed, skipped: summary.skipped },
                indices: { success: [], failed: [], skipped: [] },
                crypto: { success: [], failed: [], skipped: [] },
                totalSuccess: summary.success.length,
                totalFailed: summary.failed.length,
                totalSkipped: summary.skipped.length,
            };
        } else {
            logger.info('📊 Starting Nifty 50 backfill...');
            results = await historicalDataBackfillService.backfillTopIndianStocks(
                options.timeframe,
                options.range
            );
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        logger.info('');
        logger.info('='.repeat(60));
        logger.info('BACKFILL COMPLETE');
        logger.info('='.repeat(60));
        logger.info(`Duration: ${duration} seconds`);
        logger.info(`âœ… Success: ${results.totalSuccess} symbols`);
        logger.info(`âŒ Failed: ${results.totalFailed} symbols`);
        logger.info(`â­ï¸ Skipped: ${results.totalSkipped} symbols`);
        logger.info('='.repeat(60));

        if (results.nifty50.failed.length > 0) {
            logger.info('');
            logger.info('Failed symbols:');
            results.nifty50.failed.forEach(({ symbol, reason }) => {
                logger.info(`  âŒ ${symbol}: ${reason}`);
            });
        }

        logger.info('');
        logger.info('âœ… Backfill process completed successfully');
        logger.info('You can now use /api/ohlc endpoints to fetch historical data');
        logger.info('');

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

runBackfill();
