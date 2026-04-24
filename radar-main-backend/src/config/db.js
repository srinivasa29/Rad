const mongoose = require('mongoose');
const logger = require('./logger');
const { setupTimeSeriesCollection } = require('./timeseriesSetup');

mongoose.set('bufferCommands', false);

const getDbStatus = () => mongoose.connection.readyState === 1;

const connectDB = async () => {
    if (getDbStatus()) {
        return true;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        
        await setupTimeSeriesCollection();
        
        return true;
    } catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`);
        return false;
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
});

module.exports = { connectDB, getDbStatus };
