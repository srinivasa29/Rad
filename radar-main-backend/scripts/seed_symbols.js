const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { syncSymbolRegistry } = require('../src/services/symbolRegistryService');
const logger = require('../src/config/logger');

const run = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected. Starting symbol registry sync...');
        
        const result = await syncSymbolRegistry();
        console.log('Sync completed successfully:', result);
        
    } catch (err) {
        console.error('Sync failed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

run();
