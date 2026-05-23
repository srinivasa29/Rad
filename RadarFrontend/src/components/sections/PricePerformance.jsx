import React from 'react';
import { CalendarRange } from 'lucide-react';

export default function PricePerformance() {
  // Real world estimated performance data
  const intervals = [
    { period: '1 Week', returnVal: 2.84 },
    { period: '1 Month', returnVal: 8.12 },
    { period: '3 Month', returnVal: 18.54 },
    { period: '6 Month', returnVal: 34.12 },
    { period: 'Year to Date (YTD)', returnVal: 12.45 },
    { period: '1 Year', returnVal: 48.60 },
  ];

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <CalendarRange className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Price Performance Returns</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 font-mono">
        {intervals.map((item, idx) => {
          const isPos = item.returnVal >= 0;
          return (
            <div key={idx} className="bg-[#0b1120] p-4 rounded-lg border border-white/[0.04] flex flex-col justify-between h-20">
              <span className="text-[#7c8db5] text-[10px] font-sans font-semibold uppercase">{item.period}</span>
              <span className={`text-lg font-black ${isPos ? 'text-[#00ff9d]' : 'text-[#ff4d6d]'}`}>
                {isPos ? '+' : ''}{item.returnVal.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
