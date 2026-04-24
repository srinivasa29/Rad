const yahooFinanceService = require('./yahooFinanceService');
const ohlcService = require('./ohlcService');
const logger = require('../config/logger');



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

const SENSEX_30_SYMBOLS = [
    'RELIANCE.BO', 'TCS.BO', 'HDFCBANK.BO', 'INFY.BO', 'ICICIBANK.BO',
    'HINDUNILVR.BO', 'ITC.BO', 'SBIN.BO', 'BHARTIARTL.BO', 'KOTAKBANK.BO',
    'LT.BO', 'AXISBANK.BO', 'ASIANPAINT.BO', 'MARUTI.BO', 'HCLTECH.BO',
    'BAJFINANCE.BO', 'WIPRO.BO', 'ULTRACEMCO.BO', 'TITAN.BO', 'NESTLEIND.BO',
    'SUNPHARMA.BO', 'TECHM.BO', 'M&M.BO', 'TATASTEEL.BO', 'NTPC.BO',
    'POWERGRID.BO', 'INDUSINDBK.BO', 'TATAMOTORS.BO', 'DRREDDY.BO', 'BAJAJFINSV.BO'
];

class HistoricalDataBackfillService {
    
    async backfillSymbol(symbol, exchange = 'NSE', timeframe = '1d', range = '1y') {
        try {
            logger.info(`ðŸ”„ Starting backfill for ${symbol} (${timeframe}, ${range})`);

            const hasExisting = await this.checkExistingData(symbol, exchange, timeframe);
            if (hasExisting) {
                logger.info(`â­ï¸ Skipping ${symbol} - data already exists`);
                return {
                    success: true,
                    skipped: true,
                    message: 'Data already exists',
                };
            }

            const result = await yahooFinanceService.fetchHistoricalData(
                symbol,
                timeframe,
                range
            );

            if (!result.success || result.data.length === 0) {
                logger.warn(`âŒ No data fetched for ${symbol}`);
                return {
                    success: false,
                    message: result.message || 'No data available',
                };
            }

            const enrichedData = result.data.map(candle => ({
                ...candle,
                symbol: symbol.replace('.NS', '').replace('.BO', ''), // Remove suffix
                exchange,
                timeframe,
                source: 'yahoo',
            }));

            const insertResult = await ohlcService.bulkInsertOHLC(enrichedData);

            if (insertResult.success) {
                logger.info(`âœ… Backfilled ${insertResult.count} records for ${symbol}`);
                return {
                    success: true,
                    count: insertResult.count,
                    symbol,
                };
            } else {
                logger.error(`âŒ Failed to store data for ${symbol}`);
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

    
    async backfillNifty50(timeframe = '1d', range = '1y') {
        logger.info(`ðŸš€ Starting Nifty 50 backfill (${timeframe}, ${range})`);

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

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        logger.info(`âœ… Nifty 50 backfill complete: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`);

        return results;
    }

    
    async backfillSensex30(timeframe = '1d', range = '1y') {
        logger.info(`ðŸš€ Starting Sensex 30 backfill (${timeframe}, ${range})`);

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

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        logger.info(`âœ… Sensex 30 backfill complete: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`);

        return results;
    }

    
    async backfillTopIndianStocks(timeframe = '1d', range = '1y') {
        logger.info('ðŸš€ Starting full Indian stocks backfill');

        const niftyResults = await this.backfillNifty50(timeframe, range);
        

        return {
            nifty50: niftyResults,
            totalSuccess: niftyResults.success.length,
            totalFailed: niftyResults.failed.length,
            totalSkipped: niftyResults.skipped.length,
        };
    }

    
    getNifty50Symbols() {
        return NIFTY_50_SYMBOLS;
    }

    
    getSensex30Symbols() {
        return SENSEX_30_SYMBOLS;
    }
}

module.exports = new HistoricalDataBackfillService();
