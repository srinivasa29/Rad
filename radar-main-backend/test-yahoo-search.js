const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function run() {
  try {
    const res = await yahooFinance.search('accenture');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
