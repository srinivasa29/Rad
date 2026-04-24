import { useMemo, useState } from "react";

const buildPath = (series, width, height) => {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;
  return series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const MainChartSection = ({ chart }) => {
  const timeframeOptions = ["1D", "5D", "1M", "1Y"];
  const indicatorOptions = ["SMA", "EMA", "RSI"];

  const [timeframe, setTimeframe] = useState("1D");
  const [enabledIndicators, setEnabledIndicators] = useState(["SMA", "EMA"]);

  const series = chart.timeframes[timeframe] || [];

  const pathData = useMemo(() => buildPath(series, 940, 360), [series]);

  const toggleIndicator = (name) => {
    setEnabledIndicators((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(10,18,34,0.82)] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Main Chart</h2>

        <div className="flex flex-wrap items-center gap-2">
          {timeframeOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTimeframe(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                timeframe === option
                  ? "border-cyan-300/35 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {indicatorOptions.map((indicator) => (
          <button
            key={indicator}
            type="button"
            onClick={() => toggleIndicator(indicator)}
            className={`rounded-lg border px-2.5 py-1.5 transition ${
              enabledIndicators.includes(indicator)
                ? "border-violet-300/35 bg-violet-400/15 text-violet-100"
                : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            {indicator}
          </button>
        ))}
      </div>

      <div className="mt-4 h-[60vh] min-h-[360px] rounded-xl border border-white/10 bg-slate-950/50 p-3">
        <svg viewBox="0 0 960 380" className="h-full w-full">
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,211,238,0.45)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.03)" />
            </linearGradient>
          </defs>
          <path d={pathData} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          <path d={`${pathData} L 960 380 L 0 380 Z`} fill="url(#lineFill)" opacity="0.45" />
        </svg>
      </div>
    </section>
  );
};

export default MainChartSection;
