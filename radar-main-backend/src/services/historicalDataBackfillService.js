const yahooFinanceService = require('./yahooFinanceService');
const ohlcService = require('./ohlcService');
const logger = require('../config/logger');

/**
 * Historical Data Backfill Service
 * Downloads and stores historical OHLC data for Indian stocks (NSE/BSE)
 * Priority: Nifty 50 and Sensex 30 stocks
 */

// Nifty 50 stocks (Top 50 NSE stocks)
const NIFTY_50_SYMBOLS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'HCLTECH.NS',
    'BAJFINANCE.NS', 'WIPRO.NS', 'ULTRACEMCO.NS', 'TITAN.NS', 'NESTLEIND.NS',
    'SUNPHARMA.NS', 'TECHM.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS',
    'M&M.NS', 'TATASTEEL.NS', 'ADANIPORTS.NS', 'BAJAJFINSV.NS', 'JSWSTEEL.NS',
    'INDUSINDBK.NS', 'TATAMOTORS.NS', 'HINDALCO.NS', 'DIVISLAB.NS', 'COALINDIA.NS',
    'DRREDDY.NS', 'EICHERMOT.NS', 'CIPLA.NS', 'GRASIM.NS', 'BRITANNIA.NS',
    'HEROMOTOCO.NS', 'SHREECEM.NS', 'APOLLOHOSP.NS', 'UPL.NS', 'BPCL.NS',
    'TATACONSUM.NS', 'SBILIFE.NS', 'ADANIENT.NS', 'HDFCLIFE.NS', 'BAJAJ-AUTO.NS'
];

// Sensex 30 stocks (Top 30 BSE stocks) - Can be added later
const SENSEX_30_SYMBOLS = [
    'RELIANCE.BO', 'TCS.BO', 'HDFCBANK.BO', 'INFY.BO', 'ICICIBANK.BO',
    'HINDUNILVR.BO', 'ITC.BO', 'SBIN.BO', 'BHARTIARTL.BO', 'KOTAKBANK.BO',
    'LT.BO', 'AXISBANK.BO', 'ASIANPAINT.BO', 'MARUTI.BO', 'HCLTECH.BO',
    'BAJFINANCE.BO', 'WIPRO.BO', 'ULTRACEMCO.BO', 'TITAN.BO', 'NESTLEIND.BO',
    'SUNPHARMA.BO', 'TECHM.BO', 'M&M.BO', 'TATASTEEL.BO', 'NTPC.BO',
    'POWERGRID.BO', 'INDUSINDBK.BO', 'TATAMOTORS.BO', 'DRREDDY.BO', 'BAJAJFINSV.BO'
];

class HistoricalDataBackfillService {
    /**
     * Backfill historical data for a single symbol
     * @param {String} symbol - Stock symbol (e.g., 'RELIANCE.NS')
     * @param {String} exchange - Exchange (NSE or BSE)
     * @param {String} timeframe - Timeframe (1d, 1h, 15m, 5m)
     * @param {String} range - Time range (1mo, 3mo, 6mo, 1y, 2y)
     * @returns {Object} Result
     */
    async backfillSymbol(symbol, exchange = 'NSE', timeframe = '1d', range = '1y') {
        try {
            logger.info(`🔄 Starting backfill for ${symbol} (${timeframe}, ${range})`);

            // Check if data already exists
            const hasExisting = await this.checkExistingData(symbol, exchange, timeframe);
            if (hasExisting) {
                logger.info(`⏭️ Skipping ${symbol} - data already exists`);
                return {
                    success: true,
                    skipped: true,
                    message: 'Data already exists',
                };
            }

            // Fetch data from Yahoo Finance
            const result = await yahooFinanceService.fetchHistoricalData(
                symbol,
                timeframe,
                range
            );

            if (!result.success || result.data.length === 0) {
                logger.warn(`❌ No data fetched for ${symbol}`);
                return {
                    success: false,
                    message: result.message || 'No data available',
                };
            }

            // Add metadata to each record
            const enrichedData = result.data.map(candle => ({
                ...candle,
                symbol: symbol.replace('.NS', '').replace('.BO', ''), // Remove suffix
                exchange,
                timeframe,
                source: 'yahoo',
            }));

            // Store in MongoDB
            const insertResult = await ohlcService.bulkInsertOHLC(enrichedData);

            if (insertResult.success) {
                logger.info(`✅ Backfilled ${insertResult.count} records for ${symbol}`);
                return {
                    success: true,
                    count: insertResult.count,
                    symbol,
                };
            } else {
                logger.error(`❌ Failed to store data for ${symbol}`);
                return {
                    success: false,
                    message: insertResult.message,
                };
            }
        } catch (error) {
            logger.error(`Error backfilling ${symbol}: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Check if data already exists for a symbol
     * @param {String} symbol - Stock symbol
     * @param {String} exchange - Exchange
     * @param {String} timeframe - Timeframe
     * @returns {Boolean} True if data exists
     */
    async checkExistingData(symbol, exchange, timeframe) {
        try {
            const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // Check last month

            return await ohlcService.hasData(
                cleanSymbol,
                exchange,
                timeframe,
                startDate,
                endDate
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Backfill Nifty 50 stocks
     * @param {String} timeframe - Timeframe (1d, 1h, 15m, 5m)
     * @param {String} range - Time range
     * @returns {Object} Summary
     */
    async backfillNifty50(timeframe = '1d', range = '1y') {
        logger.info(`🚀 Starting Nifty 50 backfill (${timeframe}, ${range})`);

        const results = {
            success: [],
            failed: [],
            skipped: [],
            total: NIFTY_50_SYMBOLS.length,
        };

        for (let i = 0; i < NIFTY_50_SYMBOLS.length; i++) {
            const symbol = NIFTY_50_SYMBOLS[i];
            logger.info(`[${i + 1}/${NIFTY_50_SYMBOLS.length}] Processing ${symbol}`);

            const result = await this.backfillSymbol(symbol, 'NSE', timeframe, range);

            if (result.skipped) {
                results.skipped.push(symbol);
            } else if (result.success) {
                results.success.push({
                    symbol,
                    count: result.count,
                });
            } else {
                results.failed.push({
                    symbol,
                    reason: result.message,
                });
            }

            // Rate limiting: Wait 300ms between symbols
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        logger.info(`✅ Nifty 50 backfill complete: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`);

        return results;
    }

    /**
     * Backfill Sensex 30 stocks
     * @param {String} timeframe - Timeframe
     * @param {String} range - Time range
     * @returns {Object} Summary
     */
    async backfillSensex30(timeframe = '1d', range = '1y') {
        logger.info(`🚀 Starting Sensex 30 backfill (${timeframe}, ${range})`);

        const results = {
            success: [],
            failed: [],
            skipped: [],
            total: SENSEX_30_SYMBOLS.length,
        };

        for (let i = 0; i < SENSEX_30_SYMBOLS.length; i++) {
            const symbol = SENSEX_30_SYMBOLS[i];
            logger.info(`[${i + 1}/${SENSEX_30_SYMBOLS.length}] Processing ${symbol}`);

            const result = await this.backfillSymbol(symbol, 'BSE', timeframe, range);

            if (result.skipped) {
                results.skipped.push(symbol);
            } else if (result.success) {
                results.success.push({
                    symbol,
                    count: result.count,
                });
            } else {
                results.failed.push({
                    symbol,
                    reason: result.message,
                });
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        logger.info(`✅ Sensex 30 backfill complete: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`);

        return results;
    }

    /**
     * Backfill all top Indian stocks (Nifty 50 + Sensex 30)
     * @param {String} timeframe - Timeframe
     * @param {String} range - Time range
     * @returns {Object} Combined summary
     */
    async backfillTopIndianStocks(timeframe = '1d', range = '1y') {
        logger.info('🚀 Starting full Indian stocks backfill');

        const niftyResults = await this.backfillNifty50(timeframe, range);
        
        // Optional: Add Sensex 30 later (many overlap with Nifty 50)
        // const sensexResults = await this.backfillSensex30(timeframe, range);

        return {
            nifty50: niftyResults,
            // sensex30: sensexResults,
            totalSuccess: niftyResults.success.length,
            totalFailed: niftyResults.failed.length,
            totalSkipped: niftyResults.skipped.length,
        };
    }

    /**
     * Get list of Nifty 50 symbols
     * @returns {Array} Nifty 50 symbols
     */
    getNifty50Symbols() {
        return NIFTY_50_SYMBOLS;
    }

    /**
     * Get list of Sensex 30 symbols
     * @returns {Array} Sensex 30 symbols
     */
    getSensex30Symbols() {
        return SENSEX_30_SYMBOLS;
    }
}

module.exports = new HistoricalDataBackfillService();
