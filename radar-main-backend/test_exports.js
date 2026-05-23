const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const symbol = 'TCS.NS';
    console.log('Fetching quote for:', symbol);
    const quote = await yahooFinance.quote(symbol);
    console.log('Quote regularMarketPrice:', quote.regularMarketPrice);
    console.log('Quote regularMarketDayHigh:', quote.regularMarketDayHigh);
    console.log('Quote longName:', quote.longName);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
