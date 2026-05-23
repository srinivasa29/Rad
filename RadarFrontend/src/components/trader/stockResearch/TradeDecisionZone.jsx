import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { formatPrice } from '../../../utils/currency';

const Panel = ({ children, className = '' }) => (
  <div className={`rounded-xl p-5 ${className}`}
    style={{ background: '#0D1421', border: '1px solid rgba(255,255,255,0.07)' }}>
    {children}
  </div>
);

const PanelLabel = ({ children }) => (
  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{children}</div>
);

const Row = ({ label, value, valueClass = 'text-slate-200' }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
  </div>
);

const CHECKLIST = [
  { label: 'Price above EMA 20',       pass: true  },
  { label: 'Volume above 20D average', pass: true  },
  { label: 'RSI in momentum zone',     pass: true  },
  { label: 'MACD bullish crossover',   pass: true  },
  { label: 'Sector outperforming',     pass: false },
  { label: 'No major resistance near', pass: false },
];

export default function TradeDecisionZone({ stock, keyLevels, techData, isSidebar = false }) {
  const price = stock?.price ?? 0;
  
  // ── 1. Signal & Trend ──
  const score = techData?.score?.score ?? 50;
  const bias = techData?.score?.bias ?? 'neutral';
  const isPos = bias === 'bullish' || (bias === 'neutral' && (stock?.changePercent ?? 0) >= 0);
  const rsi = techData?.indicators?.rsi ?? 50;
  
  let signalText = 'Hold';
  let signalColor = 'text-slate-400';
  if (score >= 70) { signalText = 'Strong Buy'; signalColor = 'text-emerald-400'; }
  else if (score >= 55) { signalText = 'Buy'; signalColor = 'text-emerald-400'; }
  else if (score <= 30) { signalText = 'Strong Sell'; signalColor = 'text-rose-400'; }
  else if (score <= 45) { signalText = 'Sell'; signalColor = 'text-rose-400'; }
 
  // ── 2. Trade Setup ──
  const support = keyLevels?.support?.s1 ?? (price * 0.98);
  const resistance = keyLevels?.resistance?.r1 ?? (price * 1.04);
  
  let entry = price;
  let sl = 0;
  let target = 0;
 
  if (bias === 'bullish') {
    entry = +(price * 0.998).toFixed(2);
    sl = +(support * 0.995).toFixed(2);
    target = +(resistance * 0.99).toFixed(2);
  } else if (bias === 'bearish') {
    entry = +(price * 1.002).toFixed(2);
    sl = +(resistance * 1.005).toFixed(2);
    target = +(support * 1.01).toFixed(2);
  } else {
    entry = price;
    sl = +(price * 0.98).toFixed(2);
    target = +(price * 1.03).toFixed(2);
  }
 
  // Fallback to avoid NaN or division by zero
  if (sl >= entry && bias !== 'bearish') sl = entry * 0.98;
  if (target <= entry && bias !== 'bearish') target = entry * 1.03;
  if (sl <= entry && bias === 'bearish') sl = entry * 1.02;
  if (target >= entry && bias === 'bearish') target = entry * 0.97;
 
  const riskAmt = Math.abs(entry - sl);
  const rewardAmt = Math.abs(target - entry);
  const rr = riskAmt > 0 ? (rewardAmt / riskAmt).toFixed(1) : '0.0';
 
  // ── 3. Risk Analysis ──
  const ema20 = techData?.indicators?.ema20 ?? price;
  const volStatus = techData?.indicators?.volumeStatus ?? 'average';
  const dailyTrend = techData?.trendMatrix?.['1d'] ?? 'neutral';
 
  const checklist = [
    { label: 'Price above EMA 20', pass: price > ema20 },
    { label: 'Volume above average', pass: ['high_volume', 'above_average'].includes(volStatus) },
    { label: 'RSI in momentum zone', pass: rsi >= 50 && rsi <= 70 },
    { label: 'Trend aligned with Daily', pass: dailyTrend === bias && bias !== 'neutral' },
    { label: 'Sector outperforming', pass: score > 60 },
    { label: 'No major resistance near', pass: bias === 'bullish' ? price < resistance * 0.98 : price > support * 1.02 },
  ];
 
  const passed = checklist.filter(c => c.pass).length;
  const riskLabel = passed >= 5 ? 'Low' : passed >= 3 ? 'Medium' : 'High';
  const riskColor = passed >= 5 ? 'text-emerald-400' : passed >= 3 ? 'text-amber-400' : 'text-rose-400';
 
  // ── 4. Invalidation ──
  const invConditions = bias === 'bullish' ? [
    `Close below ${formatPrice(sl, stock?.type, stock?.symbol)} (S1 support)`,
    `Volume dries up below average`,
    `RSI breaks below 40 on daily`,
    `Trend shifts to bearish`,
  ] : bias === 'bearish' ? [
    `Close above ${formatPrice(sl, stock?.type, stock?.symbol)} (R1 resistance)`,
    `Unusual high volume on up-moves`,
    `RSI crosses above 60 on daily`,
    `Trend shifts to bullish`,
  ] : [
    `Price breaks out of ${formatPrice(sl, stock?.type, stock?.symbol)} - ${formatPrice(target, stock?.type, stock?.symbol)} range`,
    `Volume spikes significantly`,
    `RSI enters overbought/oversold`,
    `Trend establishes direction`,
  ];
 
  return (
    <div className={isSidebar ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"}>

      {/* 1 — Signal & Trend */}
      <Panel>
        <PanelLabel>Signal & Trend</PanelLabel>
        <Row label="Trend"    value={bias.charAt(0).toUpperCase() + bias.slice(1)} valueClass={isPos ? 'text-emerald-400' : 'text-rose-400'} />
        <Row label="Signal"   value={signalText} valueClass={signalColor} />
        <Row label="Strength" value={`${score} / 100`} valueClass="text-slate-200" />
        <Row label="Momentum" value={rsi > 50 ? 'Rising' : 'Falling'} valueClass="text-slate-200" />
        <Row label="Bias"     value={bias === 'bullish' ? 'Long' : bias === 'bearish' ? 'Short' : 'Neutral'} valueClass="text-slate-200" />
      </Panel>

      {/* 2 — Trade Setup */}
      <Panel>
        <PanelLabel>Trade Setup</PanelLabel>
        <Row label="Entry Zone"   value={formatPrice(entry, stock?.type, stock?.symbol)}  valueClass="text-slate-200" />
        <Row label="Stop Loss"    value={formatPrice(sl, stock?.type, stock?.symbol)}     valueClass="text-rose-400" />
        <Row label="Target 1"     value={formatPrice(target, stock?.type, stock?.symbol)} valueClass="text-emerald-400" />
        <div className="flex items-center justify-between pt-3 mt-1">
          <span className="text-xs text-slate-500">Risk : Reward</span>
          <span className="text-base font-bold text-slate-200">1 : {rr}</span>
        </div>
      </Panel>

      {/* 3 — Risk Analysis */}
      <Panel>
        <PanelLabel>Risk Analysis</PanelLabel>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-slate-500">Risk Level</span>
          <span className={`text-sm font-bold ${riskColor}`}>{riskLabel} Risk</span>
        </div>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
          <span className="text-xs text-slate-500">Confirmations</span>
          <span className="text-sm font-bold text-slate-200">{passed} / {checklist.length}</span>
        </div>
        <div className="space-y-2">
          {checklist.map(({ label, pass }) => (
            <div key={label} className="flex items-center gap-2.5">
              {pass
                ? <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                : <Circle       size={12} className="text-slate-700    flex-shrink-0" />}
              <span className={`text-[11px] ${pass ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* 4 — Invalidation */}
      <Panel>
        <PanelLabel>Invalidation Conditions</PanelLabel>
        <div className="space-y-3">
          {invConditions.map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <AlertCircle size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-slate-400 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Exit on 15m close {bias === 'bearish' ? 'above' : 'below'} stop loss with above-average volume confirmation.
          </p>
        </div>
      </Panel>

    </div>
  );
}
