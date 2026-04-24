const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const { fetchStockData } = require('./stockService');
const logger = require('../config/logger');

let alertInterval = null;
let alertEventEmitter = null;

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const emitAlertTriggered = (payload) => {
    if (typeof alertEventEmitter === 'function') {
        alertEventEmitter('alert_triggered', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }
};

const checkAlerts = async () => {
    if (!isDatabaseReady()) return;

    try {
        const activeAlerts = await Alert.find({ isActive: true });
        if (activeAlerts.length === 0) return;

        logger.info(`Checking ${activeAlerts.length} active alerts...`);
        
        // Get unique symbols to fetch data efficiently
        const symbols = [...new Set(activeAlerts.map(a => a.symbol))];
        const stockData = await fetchStockData(symbols);
        const priceMap = new Map(stockData.map(s => [s.symbol, s.price]));

        for (const alert of activeAlerts) {
            const currentPrice = priceMap.get(alert.symbol);
            if (!currentPrice) continue;

            let triggered = false;
            if (alert.type === 'price') {
                // Simplified: trigger if price crosses the target
                // For a more robust system, we'd need to know if it's "Above" or "Below"
                // But following user's minimal schema, we'll assume targetPrice is the threshold
                // and we'll trigger if currentPrice >= targetPrice (Price Above logic as default)
                if (currentPrice >= alert.targetPrice) {
                    triggered = true;
                }
            } else if (alert.type === 'percentage') {
                // Percentage logic would need a base price, but user didn't provide one
                // We'll skip or use a default base for now
            }

            if (triggered) {
                logger.info(`Alert Triggered: ${alert.symbol} at ${currentPrice}`);
                
                // 1. Notification
                if (alert.delivery === 'app' || alert.delivery === 'both') {
                    await Notification.create({
                        userId: alert.userId,
                        type: 'PRICE_ALERT',
                        title: `Price Alert: ${alert.symbol}`,
                        message: `${alert.symbol} reached target price of ${alert.targetPrice} (Current: ${currentPrice})`,
                        metadata: { symbol: alert.symbol, targetPrice: alert.targetPrice, currentPrice }
                    });
                }

                // 2. Email (Simulated for architecture)
                if (alert.delivery === 'email' || alert.delivery === 'both') {
                    logger.info(`Sending email alert to user ${alert.userId} for ${alert.symbol}`);
                }

                // 3. Mark as inactive to avoid multiple triggers
                alert.isActive = false;
                await alert.save();

                // 4. Emit to Socket.io
                emitAlertTriggered({
                    alertId: alert._id,
                    userId: alert.userId,
                    symbol: alert.symbol,
                    currentPrice
                });
            }
        }
    } catch (error) {
        logger.error(`Error in Alert Engine: ${error.message}`);
    }
};

const startAlertEngine = () => {
    if (alertInterval) return;
    logger.info("Starting Advanced Alert Engine...");
    alertInterval = setInterval(checkAlerts, 30000); // Check every 30s
};

const stopAlertEngine = () => {
    if (alertInterval) {
        clearInterval(alertInterval);
        alertInterval = null;
    }
    logger.info('Alert Engine stopped');
};

const setAlertEventEmitter = (emitter) => {
    alertEventEmitter = emitter;
};

module.exports = { startAlertEngine, stopAlertEngine, setAlertEventEmitter };
