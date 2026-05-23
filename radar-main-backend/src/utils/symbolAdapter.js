const cleanBaseSymbol = (symbol) => {
  if (!symbol) return '';
  let s = String(symbol).trim().toUpperCase();
  if (s.includes(':')) {
    s = s.split(':')[1];
  }
  s = s.replace(/\.(NS|BO)$/i, '');
  return s;
};

const toYahoo = (symbol) => {
  if (!symbol) return '';
  let s = String(symbol).trim().toUpperCase();
  if (s.includes(':')) {
    s = s.split(':')[1];
  }
  
  const knownCryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOGE', 'DOT', 'BNB', 'MATIC', 'AVAX', 'LINK', 'LTC'];
  const bareSymbol = s.replace(/\.(NS|BO)$/i, '');

  if (knownCryptos.includes(bareSymbol) || bareSymbol.endsWith('-USD') || bareSymbol.endsWith('USDT')) {
    const crypto = bareSymbol.replace(/USDT$/i, '').replace(/-USD$/i, '');
    return `${crypto}-USD`;
  }

  if (s.endsWith('.NS') || s.endsWith('.BO')) {
    return s;
  }

  // Indices
  if (s.startsWith('^') || s === 'NIFTY' || s === 'BANKNIFTY' || s === 'SENSEX') {
    if (s === 'NIFTY' || s === '^NSEI') return '^NSEI';
    if (s === 'BANKNIFTY' || s === '^NSEBANK') return '^NSEBANK';
    if (s === 'SENSEX' || s === '^BSESN') return '^BSESN';
    return s;
  }

  const usStocks = ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'NFLX', 'NVDA', 'AMD'];
  if (usStocks.includes(bareSymbol)) {
    return bareSymbol;
  }

  return `${bareSymbol}.NS`;
};

const toFinnhub = (symbol) => {
  if (!symbol) return '';
  let s = String(symbol).trim().toUpperCase();
  if (s.includes(':')) return s;

  const CRYPTO_SYMBOLS = new Set(['BTC','ETH','SOL','XRP','BNB','ADA','DOT','DOGE','MATIC','LINK','AVAX','ATOM','LTC','UNI','SHIB','TRX','ETC','FIL','NEAR','APT','ARB','OP','INJ','SUI','SEI','PEPE','WIF','TON','FLOKI','BONK']);
  const bareSymbol = s.replace(/\.(NS|BO)$/i, '');

  if (CRYPTO_SYMBOLS.has(bareSymbol) || bareSymbol.endsWith('USDT') || bareSymbol.endsWith('-USD')) {
    const crypto = bareSymbol.replace(/USDT$/i, '').replace(/-USD$/i, '');
    return `BINANCE:${crypto}USDT`;
  }

  if (s.endsWith('.BO')) {
    return `BSE:${s.replace('.BO', '')}`;
  }

  if (s.endsWith('.NS')) {
    return `NSE:${s.replace('.NS', '')}`;
  }

  // Indices
  if (s.startsWith('^') || s === 'NIFTY' || s === 'BANKNIFTY' || s === 'SENSEX') {
    if (s === '^NSEI' || s === 'NIFTY') return 'NSE:NIFTY';
    if (s === '^NSEBANK' || s === 'BANKNIFTY') return 'NSE:BANKNIFTY';
    if (s === '^BSESN' || s === 'SENSEX') return 'BSE:SENSEX';
    return s;
  }

  const usStocks = ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'NFLX', 'NVDA', 'AMD'];
  if (usStocks.includes(bareSymbol)) {
    return bareSymbol;
  }

  return `NSE:${bareSymbol}`;
};

const toAlphaVantage = (symbol) => {
  if (!symbol) return '';
  let s = String(symbol).trim().toUpperCase();
  if (s.includes(':')) {
    s = s.split(':')[1];
  }
  return s.replace(/\.(NS|BO)$/i, '');
};

module.exports = {
  cleanBaseSymbol,
  toYahoo,
  toFinnhub,
  toAlphaVantage
};
