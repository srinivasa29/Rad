/**
 * Shared currency utilities for RADAR frontend.
 * Crypto  → $ (USD)
 * Stocks/Indices → ₹ (INR)
 * Forex   → no prefix (pair already has context)
 */

const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOT', 'DOGE', 'MATIC', 'LINK',
  'AVAX', 'ATOM', 'LTC', 'UNI', 'SHIB', 'TRX', 'ETC', 'FIL', 'NEAR', 'APT',
  'ARB', 'OP', 'INJ', 'SUI', 'SEI',
  // Binance pair suffixes
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT',
]);

/**
 * Determine if an asset is crypto by type string or symbol pattern.
 * @param {string|null} type   - 'CRYPTO' | 'STOCK' | 'FOREX' | null
 * @param {string}      symbol - raw symbol e.g. 'BTC', 'RELIANCE', 'BTCUSDT'
 * @returns {boolean}
 */
export const isCryptoAsset = (type, symbol = '') => {
  if (type) return String(type).toUpperCase() === 'CRYPTO';
  const sym = String(symbol).toUpperCase().replace(/USDT$/, '');
  return CRYPTO_SYMBOLS.has(sym) || CRYPTO_SYMBOLS.has(`${sym}USDT`);
};

/**
 * Get the currency prefix for a price.
 * @param {string|null} type
 * @param {string}      symbol
 * @returns {'$' | '₹' | ''}
 */
export const getCurrencySymbol = (type, symbol = '') => {
  if (isCryptoAsset(type, symbol)) return '$';
  if (String(type).toUpperCase() === 'FOREX') return '';
  return '₹';
};

/**
 * Format a price with the correct currency prefix and locale.
 * @param {number}      price
 * @param {string|null} type
 * @param {string}      symbol
 * @returns {string}  e.g. '₹1,234.56' or '$94,321.00'
 */
export const formatPrice = (price, type, symbol = '') => {
  const num = Number(price);
  if (!Number.isFinite(num)) return '—';
  const prefix = getCurrencySymbol(type, symbol);
  const isCrypto = isCryptoAsset(type, symbol);
  // Crypto: show more decimals for small coins
  const decimals = isCrypto && num < 1 ? 4 : 2;
  return `${prefix}${num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};
