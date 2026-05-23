import React from 'react';
import { Layers } from 'lucide-react';

export default function DerivativesFO({ derivatives }) {
  const oi = derivatives?.oi ?? '14.5M';
  const pcr = derivatives?.pcr ?? 1.08;
  const futuresBias = derivatives?.futuresBias ?? 'Long Buildup';
  const maxPain = derivatives?.maxPain ?? 2500;
  const oiChange = derivatives?.oiChange ?? '+4.8%';

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Derivatives & F&O Analytics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 font-mono text-xs">
        {/* Open Interest */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-20">
          <span className="text-[#7c8db5] text-[10px] font-sans font-semibold uppercase">Open Interest (OI)</span>
          <span className="text-lg font-black text-white">{oi}</span>
        </div>

        {/* OI Change */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-20">
          <span className="text-[#7c8db5] text-[10px] font-sans font-semibold uppercase">OI Net Change</span>
          <span className="text-lg font-black text-[#00ff9d]">{oiChange}</span>
        </div>

        {/* PCR Ratio */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-20">
          <span className="text-[#7c8db5] text-[10px] font-sans font-semibold uppercase">PCR Ratio</span>
          <span className="text-lg font-black text-white">{pcr}</span>
        </div>

        {/* Max Pain */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-20">
          <span className="text-[#7c8db5] text-[10px] font-sans font-semibold uppercase">Max Pain Strike</span>
          <span className="text-lg font-black text-[#00d4ff]">₹{maxPain}</span>
        </div>

        {/* Futures Bias */}
        <div className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-20">
          <span className="text-[#7c8db5] text-[10px] font-sans font-semibold uppercase">Futures Bias</span>
          <span className="text-lg font-black text-[#00ff9d]">{futuresBias}</span>
        </div>
      </div>
    </div>
  );
}
