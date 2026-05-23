(async ()=>{
  const fs = require('fs');
  const s = require('./radar-main-backend/src/services/radarAggregationService');
  try {
    const r = await s.buildSymbolResearch('NIFTY');
    fs.writeFileSync('radar_test_out.json', JSON.stringify({ symbol: r.symbol, quoteSource: r.quote.source, indicators: r.indicators.snapshot }, null, 2));
    console.log('WROTE_OUT');
  } catch (e) {
    fs.writeFileSync('radar_test_err.txt', String(e && e.stack ? e.stack : e));
    console.error('ERR', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();