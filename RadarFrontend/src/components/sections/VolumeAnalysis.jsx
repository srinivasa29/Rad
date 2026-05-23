import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function VolumeAnalysis({ volumeAnalysis, avgVolume }) {
  const rvol = volumeAnalysis?.rvol ?? 1.45;
  const avgVol = avgVolume ?? 1000000;
  const deliveryRate = volumeAnalysis?.deliveryRate ?? 0.485;
  const accDistState = volumeAnalysis?.accDistState ?? 'Accumulation';
  const blockTrades = volumeAnalysis?.blockTradesCount ?? 14;
  const spikeClassification = volumeAnalysis?.volumeSpikeState ?? 'Normal Surge';

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Volume & Delivery Analysis</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-xs">
        
        {/* Relative Volume & Spikes */}
        <div className="bg-[#0b1120] p-5 rounded-lg border border-white/[0.04] space-y-4">
          <span className="text-[10px] font-sans font-bold text-[#7c8db5] uppercase tracking-wider block border-b border-white/5 pb-2">RVOL & Trend</span>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Relative Vol (RVOL)</span>
              <span className="text-[#00ff9d] font-bold">{rvol}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Spike Classification</span>
              <span className="text-white font-bold">{spikeClassification}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">30D Avg Volume</span>
              <span className="text-white font-bold">{(avgVol / 1e6).toFixed(2)}M</span>
            </div>
          </div>
        </div>

        {/* Delivery Rates */}
        <div className="bg-[#0b1120] p-5 rounded-lg border border-white/[0.04] space-y-4">
          <span className="text-[10px] font-sans font-bold text-[#7c8db5] uppercase tracking-wider block border-b border-white/5 pb-2">Delivery Percentage</span>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Deliverable Share Rate</span>
              <span className="text-[#00ff9d] font-bold">{(deliveryRate * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-[#00ff9d] rounded-full" 
                style={{ width: `${deliveryRate * 100}%` }} 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Accumulation Phase</span>
              <span className="text-cyan-400 font-bold uppercase">{accDistState}</span>
            </div>
          </div>
        </div>

        {/* Block Trades */}
        <div className="bg-[#0b1120] p-5 rounded-lg border border-white/[0.04] space-y-4">
          <span className="text-[10px] font-sans font-bold text-[#7c8db5] uppercase tracking-wider block border-b border-white/5 pb-2">Block Deals Summary</span>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Block Trades Count</span>
              <span className="text-white font-bold">{blockTrades} Matches</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Institutional Flows</span>
              <span className="text-[#00ff9d] font-bold">Inflow Weighted</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Liquidity Index</span>
              <span className="text-white font-bold">High Density</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
