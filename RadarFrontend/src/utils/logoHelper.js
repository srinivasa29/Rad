export const SYMBOL_DOMAINS = {
  RELIANCE: 'relianceindustries.com',
  TCS: 'tcs.com',
  INFY: 'infosys.com',
  HDFCBANK: 'hdfcbank.com',
  ICICIBANK: 'icicibank.com',
  SBIN: 'sbi.co.in',
  WIPRO: 'wipro.com',
  AXISBANK: 'axisbank.com',
  KOTAKBANK: 'kotak.com',
  LT: 'larsentoubro.com',
  ITC: 'itcportal.com',
  SUNPHARMA: 'sunpharma.com',
  TITAN: 'titancompany.in',
  BAJFINANCE: 'bajajfinserv.in',
  MARUTI: 'marutisuzuki.com',
  GRASIM: 'grasim.com',
  APOLLOHOSP: 'apollohospitals.com',
  HINDALCO: 'hindalco.com',
  COALINDIA: 'coalindia.in',
  ONGC: 'ongcindia.com',
  NTPC: 'ntpc.co.in',
  BHARTIARTL: 'airtel.in',
  TATASTEEL: 'tatasteel.com',
  JSWSTEEL: 'jsw.in',
  ADANIENT: 'adanienterprises.com',
  ADANIPORTS: 'adaniports.com',
  POWERGRID: 'powergrid.in',
  ULTRACEMCO: 'ultratechcement.com',
  HINDUNILVR: 'hul.co.in',
  NESTLEIND: 'nestle.in',
  BRITANNIA: 'britannia.co.in',
  ASIANPAINT: 'asianpaints.com',
  BAJAJ_AUTO: 'bajajauto.com',
  M_M: 'mahindra.com',
  HEROMOTOCO: 'heromotocorp.com',
  EICHERMOT: 'eichermotors.com',
  TATAMOTORS: 'tatamotors.com',
  CIPLA: 'cipla.com',
  DRREDDY: 'drreddys.com',
  DIVISLAB: 'divislabs.com',
  APOLLOTYRE: 'apollotyres.com',
  MRF: 'mrftyres.com',
  BPCL: 'bharatpetroleum.in',
  IOC: 'iocl.com',
  GAIL: 'gailonline.com',
  HINDZINC: 'hzlindia.com',
  VEDL: 'vedantalimited.com',
  BTC: 'bitcoin.org',
  ETH: 'ethereum.org',
  SOL: 'solana.com',
  ADA: 'cardano.org',
  XRP: 'ripple.com',
  DOGE: 'dogecoin.com',
  DOT: 'polkadot.network',
  BNB: 'binance.com',
  MATIC: 'polygon.technology',
  AVAX: 'avax.network',
  LINK: 'chain.link',
  LTC: 'litecoin.org'
};

export const getLogoUrlForSymbol = (symbol, website) => {
  const cleanSym = String(symbol || '').replace(/\.(NS|BO)$/i, '').toUpperCase().trim();
  
  if (SYMBOL_DOMAINS[cleanSym]) {
    return `https://logo.clearbit.com/${SYMBOL_DOMAINS[cleanSym]}`;
  }
  
  if (website) {
    const domain = website.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    if (domain) {
      return `https://logo.clearbit.com/${domain}`;
    }
  }
  
  return `https://logo.clearbit.com/${cleanSym.toLowerCase()}.com`;
};
