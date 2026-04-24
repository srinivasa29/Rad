


export const calculateTradeScore = (price, rsi, trend, isVolumeSpike) => {
  let score = 50; // Base neutral score

  if (rsi > 40 && rsi < 65) score += 15;
  else if (rsi > 70) score -= 10; // Overbought
  else if (rsi < 30) score += 10; // Potential reversal

  if (trend === 'bullish') score += 20;
  else if (trend === 'bearish') score -= 15;

  if (isVolumeSpike) score += 10;

  return Math.max(0, Math.min(100, score));
};


export const getSignalTags = (price, rsi, trend, vwap, volume, avgVolume) => {
  const signals = [];

  if (trend === 'bullish' && price > vwap) signals.push('BREAKOUT');
  if (trend === 'bearish' && price < vwap) signals.push('BREAKDOWN');
  if (volume > avgVolume * 1.5) signals.push('VOL_SPIKE');
  if (rsi > 70) signals.push('OVERBOUGHT');
  if (rsi < 30) signals.push('OVERSOLD');
  if (trend === 'bullish') signals.push('STRONG_TREND');

  return signals.slice(0, 3); // Limit to top 3 signals
};


export const calculateTradeLevels = (price, trend) => {
  const volatility = price * 0.02; // 2% assumed volatility for mock levels
  
  if (trend === 'bullish') {
    return {
      entry: price,
      stopLoss: price - volatility,
      target: price + (volatility * 2), // 1:2 Risk-Reward
      rr: '1:2'
    };
  } else {
    return {
      entry: price,
      stopLoss: price + volatility,
      target: price - (volatility * 2),
      rr: '1:2'
    };
  }
};


export const generateAIInsight = (symbol, score, signals, trend) => {
  if (score > 80) {
    return `Strong bullish momentum for ${symbol} with ${signals.join(', ')} signal confirmed.`;
  }
  if (score < 40) {
    return `${symbol} is displaying weakness; avoid longs until structural support is reclaimed.`;
  }
  if (signals.includes('VOL_SPIKE')) {
    return `Volume surge detected in ${symbol}. Monitor for immediate price discovery.`;
  }
  return `${symbol} is consolidating within a neutral range; watch for breakout triggers.`;
};


export const calculateRSI = (series, periods = 14) => {
  if (series.length < periods) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= periods; i++) {
    const diff = series[series.length - i] - series[series.length - i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
};
