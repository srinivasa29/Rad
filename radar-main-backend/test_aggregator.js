require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { fetchSymbolData } = require('./src/services/marketAggregator');
const mongoose = require('mongoose');

async function runTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/radar');
  console.log('Connected.');

  const symbols = ['AAPL', 'RELIANCE', 'TCS'];
  
  for (const sym of symbols) {
    console.log(`\n========================================`);
    console.log(`Fetching aggregated data for: ${sym}`);
    console.log(`========================================`);
    try {
      const data = await fetchSymbolData(sym);
      console.log('Result data:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error fetching data for ${sym}:`, err);
    }
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB.');
}

runTest().catch(console.error);
