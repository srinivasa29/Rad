export const normalizeSymbol = (symbol) => String(symbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');

export const withNseSuffix = (symbol) => {
  const clean = normalizeSymbol(symbol);
  if (!clean) return '';
  if (clean.startsWith('^') || clean.includes('-USD')) return clean;
  return `${clean}.NS`;
};

export const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

export const compactNumber = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2).replace(/\.00$/, '')}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return amount ? amount.toLocaleString('en-IN') : '-';
};

export const toPercent = (value) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

export const exchangeLabel = (item) => {
  const ex = item?.exchange || 'NSE';
  const sector = item?.sector || item?.industry || item?.assetType || 'Equity';
  return `${ex} • ${sector}`;
};
