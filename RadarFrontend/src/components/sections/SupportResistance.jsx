import React from 'react';
import { Sliders } from 'lucide-react';

export default function SupportResistance({ pivots }) {
  const pp = pivots?.pivotPoint ?? 0;
  const r1 = pivots?.r1 ?? 0;
  const r2 = pivots?.r2 ?? 0;
  const r3 = pivots?.r3 ?? 0;
  const s1 = pivots?.s1 ?? 0;
  const s2 = pivots?.s2 ?? 0;
  const s3 = pivots?.s3 ?? 0;

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <Sliders className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Support & Resistance Levels</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[#7c8db5] font-sans text-[10px] uppercase font-bold">
              <th className="pb-3 pr-4">Level Name</th>
              <th className="pb-3 text-center">Type</th>
              <th className="pb-3 text-right">Price (INR)</th>
              <th className="pb-3 text-right">Distance from Pivot</th>
            </tr>
          </thead>
          <tbody>
            {/* Resistances */}
            <tr className="border-b border-white/[0.04] hover:bg-white/[0.01]">
              <td className="py-2.5 font-bold text-[#ff4d6d]">R3 Resistance</td>
              <td className="py-2.5 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] bg-[#ff4d6d]/10 text-[#ff4d6d] font-sans font-black">MAJOR RESISTANCE</span></td>
              <td className="py-2.5 text-right text-white font-bold">₹{r3 ? r3.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '—'}</td>
              <td className="py-2.5 text-right text-[#ff4d6d] font-bold">+{pp ? ((r3 - pp) / pp * 100).toFixed(2) : 0}%</td>
            </tr>
            <tr className="border-b border-white/[0.04] hover:bg-white/[0.01]">
              <td className="py-2.5 font-bold text-[#ff4d6d]">R2 Resistance</td>
              <td className="py-2.5 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] bg-[#ff4d6d]/10 text-[#ff4d6d] font-sans font-black">RESISTANCE 2</span></td>
              <td className="py-2.5 text-right text-white font-bold">₹{r2 ? r2.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '—'}</td>
              <td className="py-2.5 text-right text-[#ff4d6d] font-bold">+{pp ? ((r2 - pp) / pp * 100).toFixed(2) : 0}%</td>
            </tr>
            <tr className="border-b border-white/[0.04] hover:bg-white/[0.01]">
              <td className="py-2.5 font-bold text-[#ff4d6d]">R1 Resistance</td>
              <td className="py-2.5 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] bg-[#ff4d6d]/10 text-[#ff4d6d] font-sans font-black">RESISTANCE 1</span></td>
              <td className="py-2.5 text-right text-white font-bold">₹{r1 ? r1.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '—'}</td>
              <td className="py-2.5 text-right text-[#ff4d6d] font-bold">+{pp ? ((r1 - pp) / pp * 100).toFixed(2) : 0}%</td>
            </tr>

            {/* Pivot */}
            <tr className="border-b border-white/[0.08] hover:bg-white/[0.01] bg-[#0b1120]/40">
              <td className="py-3 font-black text-cyan-400">PP Pivot Point</td>
              <td className="py-3 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 font-sans font-black">PIVOT AXIS</span></td>
              <td className="py-3 text-right text-white font-black">₹{pp ? pp.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '—'}</td>
              <td className="py-3 text-right text-[#7c8db5]">—</td>
            </tr>

            {/* Supports */}
            <tr className="border-b border-white/[0.04] hover:bg-white/[0.01]">
              <td className="py-2.5 font-bold text-[#00ff9d]">S1 Support</td>
              <td className="py-2.5 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] bg-[#00ff9d]/10 text-[#00ff9d] font-sans font-black">SUPPORT 1</span></td>
              <td className="py-2.5 text-right text-white font-bold">₹{s1 ? s1.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '—'}</td>
              <td className="py-2.5 text-right text-[#00ff9d] font-bold">-{pp ? ((pp - s1) / pp * 100).toFixed(2) : 0}%</td>
            </tr>
            <tr className="border-b border-white/[0.04] hover:bg-white/[0.01]">
              <td className="py-2.5 font-bold text-[#00ff9d]">S2 Support</td>
              <td className="py-2.5 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] bg-[#00ff9d]/10 text-[#00ff9d] font-sans font-black">SUPPORT 2</span></td>
              <td className="py-2.5 text-right text-white font-bold">₹{s2 ? s2.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '—'}</td>
              <td className="py-2.5 text-right text-[#00ff9d] font-bold">-{pp ? ((pp - s2) / pp * 100).toFixed(2) : 0}%</td>
            </tr>
            <tr className="hover:bg-white/[0.01]">
              <td className="py-2.5 font-bold text-[#00ff9d]">S3 Support</td>
              <td className="py-2.5 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] bg-[#00ff9d]/10 text-[#00ff9d] font-sans font-black">MAJOR SUPPORT</span></td>
              <td className="py-2.5 text-right text-white font-bold">₹{s3 ? s3.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '—'}</td>
              <td className="py-2.5 text-right text-[#00ff9d] font-bold">-{pp ? ((pp - s3) / pp * 100).toFixed(2) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
