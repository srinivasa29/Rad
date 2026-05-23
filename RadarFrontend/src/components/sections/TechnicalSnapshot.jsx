import React from 'react';
import { Activity, Compass, TrendingUp } from 'lucide-react';

export default function TechnicalSnapshot({ techData, currentPrice }) {
  const rsi = techData?.rsi ?? 52.4;
  const macdHist = techData?.macd?.hist ?? 4.8;
  const macdBias = techData?.macd?.signal ?? 'Neutral';
  const atr = techData?.atr ?? 42.8;
  const vwap = techData?.vwap ?? ((currentPrice || 0) * 1.002);
  const emaTrend = techData?.emas?.cross ?? 'Bullish';
  const rvol = techData?.rvol ?? 1.45;

  const getRsiClass = (v) => {
    if (v > 65) return 'text-[#00ff9d] bg-[#00ff9d]/5';
    if (v < 35) return 'text-[#ff4d6d] bg-[#ff4d6d]/5';
    return 'text-[#facc15] bg-[#facc15]/5';
  };

  const getRsiLabel = (v) => {
    if (v > 65) return 'OVERBOUGHT';
    if (v < 35) return 'OVERSOLD';
    return 'NEUTRAL';
  };

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Technical Snapshot</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 font-mono">
        {/* RSI */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-24">
          <span className="text-[#7c8db5] text-[10px] uppercase font-sans font-semibold">RSI (14)</span>
          <span className="text-xl font-bold text-white">{Number(rsi).toFixed(2)}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-center ${getRsiClass(rsi)}`}>
            {getRsiLabel(rsi)}
          </span>
        </div>

        {/* MACD Bias */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-24">
          <span className="text-[#7c8db5] text-[10px] uppercase font-sans font-semibold">MACD Bias</span>
          <span className="text-xl font-bold text-white">+{macdHist}</span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-center text-[#00ff9d] bg-[#00ff9d]/5 uppercase">
            {macdBias}
          </span>
        </div>

        {/* ATR */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-24">
          <span className="text-[#7c8db5] text-[10px] uppercase font-sans font-semibold">ATR (14)</span>
          <span className="text-xl font-bold text-white">₹{atr}</span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-center text-[#7c8db5] bg-white/5 uppercase">
            Volatility
          </span>
        </div>

        {/* VWAP */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-24">
          <span className="text-[#7c8db5] text-[10px] uppercase font-sans font-semibold">VWAP Position</span>
          <span className="text-sm font-bold text-white truncate">₹{Number(vwap).toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-center uppercase ${
            currentPrice >= vwap ? 'text-[#00ff9d] bg-[#00ff9d]/5' : 'text-[#ff4d6d] bg-[#ff4d6d]/5'
          }`}>
            {currentPrice >= vwap ? 'ABOVE VWAP' : 'BELOW VWAP'}
          </span>
        </div>

        {/* EMA Trend */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-24">
          <span className="text-[#7c8db5] text-[10px] uppercase font-sans font-semibold">EMA Trend</span>
          <span className="text-xl font-bold text-white">{emaTrend}</span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-center text-[#00ff9d] bg-[#00ff9d]/5 uppercase">
            Bullish Cross
          </span>
        </div>

        {/* Relative Volume */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-24">
          <span className="text-[#7c8db5] text-[10px] uppercase font-sans font-semibold">Relative Vol</span>
          <span className="text-xl font-bold text-white">{rvol}x</span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-center text-[#00d4ff] bg-[#00d4ff]/5 uppercase">
            {rvol > 1.2 ? 'Active' : 'Moderate'}
          </span>
        </div>
      </div>
    </div>
  );
}
