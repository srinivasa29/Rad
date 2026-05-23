// Utility to format symbols for TradingView charts
// Ensures symbols are prefixed with the exchange, e.g., NSE:HINDALCO
// Strips common suffixes like .NS or .BO before adding the prefix.

export function toTradingViewSymbol(symbol, exchange = 'NSE') {
  const clean = String(symbol || '')
    .toUpperCase()
    .replace(/\.(NS|BO)$/i, '')
    .trim();
  return `${exchange}:${clean}`;
}
