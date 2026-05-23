import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';

export default function ChartToolbar({
  activeTimeframe,
  setTimeframe,
  activeIndicators,
  toggleIndicator,
}) {
  const [showIndicatorDropdown, setShowIndicatorDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const timeframes = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];
  const indicatorsList = ['EMA 20', 'EMA 50', 'VWAP', 'Bollinger Bands', 'RSI', 'MACD'];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowIndicatorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeCount = activeIndicators.filter(i => indicatorsList.includes(i)).length;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#07090f] border-b border-white/[0.05] font-sans select-none">

      {/* Timeframe Buttons */}
      <div className="flex items-center gap-0.5">
        {timeframes.map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`
              px-3.5 py-1.5 rounded text-[11px] font-bold tracking-wide uppercase transition-all
              ${activeTimeframe === tf
                ? 'bg-[#0d2535] text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_8px_rgba(0,212,255,0.12)]'
                : 'text-[#5a6a8a] hover:text-[#a8b8d8] hover:bg-white/[0.04] border border-transparent'
              }
            `}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Right: Indicators Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowIndicatorDropdown(v => !v)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all border
            ${showIndicatorDropdown
              ? 'bg-[#0d2535] text-[#00d4ff] border-[#00d4ff]/30'
              : 'bg-transparent text-[#7c8aa5] border-white/[0.07] hover:text-[#a8b8d8] hover:border-white/[0.14]'
            }
          `}
        >
          <span>Indicators</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#00d4ff]/20 text-[#00d4ff] leading-none">
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={11}
            className={`transition-transform duration-200 ${showIndicatorDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {showIndicatorDropdown && (
          <div className="absolute right-0 top-9 z-[400] w-48 bg-[#0a0e1a] border border-white/[0.09] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 text-[11px]">
            <p className="px-2 py-1 text-[9px] font-black tracking-widest uppercase text-[#3a4a6a] mb-1">
              Technical Indicators
            </p>
            {indicatorsList.map(ind => {
              const isActive = activeIndicators.includes(ind);
              return (
                <button
                  key={ind}
                  onClick={() => toggleIndicator(ind)}
                  className={`
                    w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all
                    ${isActive
                      ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                      : 'text-[#c8d4e8] hover:bg-white/[0.05] hover:text-white'
                    }
                  `}
                >
                  <span>{ind}</span>
                  {isActive
                    ? <CheckCircle size={11} className="text-[#00ff9d] flex-shrink-0" />
                    : <span className="w-3 h-3 rounded-full border border-white/[0.15] flex-shrink-0" />
                  }
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
