import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function Fundamentals({ fundamentals, stockDetails }) {
  const pe = fundamentals?.pe ?? 24.5;
  const roe = fundamentals?.roe ?? 18.2;
  const roa = fundamentals?.roa ?? 12.5;
  const revGrowth = fundamentals?.revGrowth ?? 14.2;
  const debtEquity = fundamentals?.debtEquity ?? 0.35;
  const eps = fundamentals?.epsGrowth ?? 16.8; // Fallback to EPS growth metrics

  const metrics = [
    { label: 'P/E Ratio', value: pe, format: (v) => String(v) },
    { label: 'ROE %', value: roe, format: (v) => `${v}%`, highlight: true },
    { label: 'ROA %', value: roa, format: (v) => `${v}%`, highlight: true },
    { label: 'Revenue Growth', value: revGrowth, format: (v) => `+${v}%`, highlight: true },
    { label: 'Debt to Equity', value: debtEquity, format: (v) => String(v) },
    { label: 'EPS Growth', value: eps, format: (v) => `+${v}%`, highlight: true }
  ];

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <SlidersHorizontal className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Fundamental Metrics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 font-mono text-xs">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-20">
            <span className="text-[#7c8db5] text-[10px] font-sans font-semibold uppercase">{m.label}</span>
            <span className={`text-lg font-black ${m.highlight ? 'text-[#00ff9d]' : 'text-white'}`}>
              {m.value != null ? m.format(m.value) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
