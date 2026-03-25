import { useState, useEffect } from "react";
import { useAsset } from "../../context/AssetContext";
import { fetchMarketHistory } from "../../api/marketApi";
import { Settings, Maximize2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Tooltip, XAxis, YAxis, Area, Line, CartesianGrid } from "recharts";

const BACKEND_SYMBOL_MAP = {
  RELIANCE: "RELIANCE.NS",
  HDFCBANK: "HDFCBANK.NS",
  INFY: "INFY.NS",
  TCS: "TCS.NS",
  "NIFTY 50": "^NSEI",
  BANKNIFTY: "^NSEBANK",
};

const BACKEND_INTERVAL_MAP = {
  "1m": "1D",
  "5m": "1D",
  "15m": "1D",
  "1h": "1D",
  "4h": "1W",
  "1D": "1M",
};

const normalizeChartSymbol = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const upper = raw.toUpperCase();
  if (upper === "^NSEI" || upper === "NIFTY" || upper === "NIFTY50") {
    return "NIFTY 50";
  }
  if (upper === "^NSEBANK" || upper === "BANKNIFTY") {
    return "BANKNIFTY";
  }

  return upper.replace(/\.(NS|BO)$/i, "");
};

const calculateMA = (data, period) => {
  if (!data || data.length === 0) return [];
  return data.map((point, index) => {
    if (index < period - 1) return null;
    const sum = data.slice(index - period + 1, index + 1).reduce((acc, p) => acc + (p.price || p.close), 0);
    return sum / period;
  });
};

const MultiChartGrid = ({ className, onOpenChart, timeframe = "15m", showIndicators = false, layout = "4-grid" }) => {

  const [histories, setHistories] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { activeSymbol } = useAsset();

  const getChartsToShow = () => {
    const allCharts = ["NIFTY 50", "BANKNIFTY", "RELIANCE", "HDFCBANK", "TCS", "INFY"];
    const normalizedActive = normalizeChartSymbol(activeSymbol);

    const base = normalizedActive && !allCharts.includes(normalizedActive)
      ? [normalizedActive, ...allCharts]
      : allCharts.filter((s) => s !== normalizedActive);

    if (normalizedActive) {
      base.unshift(normalizedActive);
    }

    const deduped = [...new Set(base.filter(Boolean))];

    switch (layout) {
      case "1-grid": return [deduped[0]].filter(Boolean);
      case "2-grid": return deduped.slice(0, 2);
      case "4-grid": return deduped.slice(0, 4);
      default: return deduped.slice(0, 4);
    }
  };

  const chartsToShow = getChartsToShow();
  const chartsToShowKey = chartsToShow.join(",");

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const symbols = [...new Set(chartsToShow)];
      const newHistories = {};
      await Promise.all(symbols.map(async (sym) => {
        try {
          const backendSymbol = BACKEND_SYMBOL_MAP[sym] || sym;
          const backendInterval = BACKEND_INTERVAL_MAP[timeframe] || "1D";
          const res = await fetchMarketHistory(backendSymbol, "STOCK", backendInterval);
          if (res && Array.isArray(res.data) && res.data.length > 0) {
            newHistories[sym] = res.data.map(d => ({
              ...d,
              time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              price: d.close,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close
            }));
          } else {
            newHistories[sym] = [];
          }
        } catch (err) {
          console.error(`Failed to fetch history for ${sym}`, err);
          newHistories[sym] = [];
        }
      }));
      setHistories(prev => ({ ...prev, ...newHistories }));
      setIsLoading(false);
    };
    fetchAll();
  }, [chartsToShowKey, timeframe]);
  const getGridClass = () => {
    switch (layout) {
      case "1-grid": return "grid-cols-1 grid-rows-1";
      case "2-grid": return "grid-cols-2 grid-rows-1";
      case "4-grid": return "grid-cols-2 grid-rows-2";
      default: return "grid-cols-2 grid-rows-2";
    }
  };

  return (
    <div className={`${className} h-full min-h-0`}>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#42C0A5] rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans'] uppercase tracking-wider">
                MULTI-CHART WORKSPACE
              </h3>
            </div>
          </div>
          <div className="flex gap-2 text-white/50 items-center bg-white/5 px-2 py-1 rounded-full border border-white/10">
            <span className="text-xs font-bold tracking-wider">LAYOUT: {layout.toUpperCase()}</span>
            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            <span className="text-xs text-[#42C0A5] font-mono font-bold tracking-wider">{timeframe.toUpperCase()}</span>
            {showIndicators && (
              <>
                <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                <span className="text-xs font-bold tracking-wider">• MA(7,25)</span>
              </>
            )}
          </div>
        </div>
        <div className={`flex-1 min-h-0 grid auto-rows-fr ${getGridClass()} gap-2 mb-1`}>
          {chartsToShow.map((title, i) => {
            const chartData = histories[title] || [];
            const ma7 = showIndicators ? calculateMA(chartData, 7) : [];
            const ma25 = showIndicators ? calculateMA(chartData, 25) : [];
            const latest = chartData[chartData.length - 1] || {};
            const prev = chartData[chartData.length - 2] || latest;
            const pctChange = latest.close ? (((latest.close - prev.close) / prev.close) * 100).toFixed(2) : '0.00';
            const isPos = parseFloat(pctChange) >= 0;

            return (
              <div
                key={i}
                className="bg-white/5 border border-white/5 hover:border-white/10 transition-colors rounded-xl relative group flex flex-col overflow-hidden min-h-[220px]"
              >
                <div className="flex justify-between text-xs px-2.5 py-1.5 border-b border-white/5 bg-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm tracking-wide">
                        {title}
                      </span>
                      <span className={`${isPos ? 'text-[#42C0A5]' : 'text-red-400'} text-xs font-mono font-bold`}>
                        {(latest.close || 0).toLocaleString()} ({isPos ? '+' : ''}{pctChange}%)
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-white/40 font-mono mt-0.5 font-medium tracking-wider scale-90 origin-left">
                      <span>
                        O:<span className="text-white/80 ml-1">{(latest.open || 0).toFixed(1)}</span>
                      </span>
                      <span>
                        H:<span className="text-white/80 ml-1">{(latest.high || 0).toFixed(1)}</span>
                      </span>
                      <span>
                        L:<span className="text-white/80 ml-1">{(latest.low || 0).toFixed(1)}</span>
                      </span>
                      <span>
                        C:<span className="text-white/80 ml-1">{(latest.close || 0).toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity items-start pt-1">
                    <Settings size={14} className="cursor-pointer text-white/50 hover:text-white transition-colors" />
                    <Maximize2
                      size={14}
                      className="cursor-pointer text-white/50 hover:text-white transition-colors"
                      onClick={() => onOpenChart?.(title)}
                    />
                  </div>
                </div>

                <div
                  className="flex-1 min-h-0 w-full relative p-1 cursor-pointer"
                  onClick={() => onOpenChart?.(title)}
                >
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-[#5d606b] font-mono uppercase tracking-wider">
                      Loading backend history...
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-[#5d606b] font-mono uppercase tracking-wider">
                      No backend chart data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3db26b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3db26b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#161c27",
                            border: "1px solid #293839",
                            fontSize: "10px",
                            color: "#fff",
                          }}
                          itemStyle={{ color: "#fff" }}
                          labelStyle={{ display: "none" }}
                        />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={["auto", "auto"]} />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#3db26b"
                          fill={`url(#grad${i})`}
                          strokeWidth={1.5}
                          isAnimationActive={false}
                        />
                        {showIndicators && (
                          <>
                            <Line
                              type="monotone"
                              data={chartData.map((d, idx) => ({ ...d, ma7: ma7[idx] }))}
                              dataKey="ma7"
                              stroke="#FFA500"
                              strokeWidth={1}
                              dot={false}
                              isAnimationActive={false}
                            />
                            <Line
                              type="monotone"
                              data={chartData.map((d, idx) => ({ ...d, ma25: ma25[idx] }))}
                              dataKey="ma25"
                              stroke="#FF1493"
                              strokeWidth={1}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </>
                        )}
                        <CartesianGrid
                          stroke="#293839"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default MultiChartGrid;
