import React from 'react';
import { Landmark } from 'lucide-react';

export default function SmartMoneyFlow({ institutionalActivity }) {
  const fiiFlow = institutionalActivity?.fiiFlow ?? 1240;
  const diiFlow = institutionalActivity?.diiFlow ?? -430;
  const buyPressure = institutionalActivity?.buyPressure ?? 62;
  const sellPressure = institutionalActivity?.sellPressure ?? 38;
  const zones = institutionalActivity?.zones ?? 'Accumulation';

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <Landmark className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Smart Money Flow</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        
        {/* Net Flow Figures */}
        <div className="bg-[#0b1120] p-5 rounded-lg border border-white/[0.04] space-y-4">
          <span className="text-[10px] font-sans font-bold text-[#7c8db5] uppercase tracking-wider block border-b border-white/5 pb-2">Net Institutional Flows</span>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">FII Net Flow</span>
              <span className={`font-bold ${fiiFlow >= 0 ? 'text-[#00ff9d]' : 'text-[#ff4d6d]'}`}>
                {fiiFlow >= 0 ? '+' : ''}₹{fiiFlow}Cr
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">DII Net Flow</span>
              <span className={`font-bold ${diiFlow >= 0 ? 'text-[#00ff9d]' : 'text-[#ff4d6d]'}`}>
                {diiFlow >= 0 ? '+' : ''}₹{diiFlow}Cr
              </span>
            </div>
          </div>
        </div>

        {/* Bias & Value Zones */}
        <div className="bg-[#0b1120] p-5 rounded-lg border border-white/[0.04] space-y-4">
          <span className="text-[10px] font-sans font-bold text-[#7c8db5] uppercase tracking-wider block border-b border-white/5 pb-2">Flow Bias & Value Zones</span>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Institutional Bias</span>
              <span className="text-[#00ff9d] font-bold">ACCUMULATIVE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Key Liquidity Zone</span>
              <span className="text-white font-bold">{zones}</span>
            </div>
          </div>
        </div>

        {/* Execution Buy/Sell pressure ratios */}
        <div className="bg-[#0b1120] p-5 rounded-lg border border-white/[0.04] space-y-4">
          <span className="text-[10px] font-sans font-bold text-[#7c8db5] uppercase tracking-wider block border-b border-white/5 pb-2">Bid/Ask Execution Ratios</span>
          <div className="space-y-3">
            <div className="flex justify-between items-center font-bold text-[10px]">
              <span className="text-slate-400">Bid (Buy Pressure)</span>
              <span className="text-[#00ff9d]">{buyPressure}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden flex">
              <div className="h-full bg-[#00ff9d]" style={{ width: `${buyPressure}%` }} />
              <div className="h-full bg-[#ff4d6d]" style={{ width: `${sellPressure}%` }} />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500">
              <span>Bids ({buyPressure}%)</span>
              <span>Asks ({sellPressure}%)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
