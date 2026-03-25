import { useState, useEffect } from "react";
import { Activity, Maximize2, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";




import { fetchPulse, fetchHeatmap } from "../api/analyticsApi";
import { fetchTechnicalSummary, fetchBreakoutAlerts, fetchIndicatorSignals, fetchQuickOrderData, fetchWatchlistTechnicals } from "../api/technicalApi";
import { fetchEconomicCalendar } from "../api/calendarApi";
import { fetchPortfolio, executeTrade } from "../api/portfolioApi";
import { fetchFnoDashboard } from "../api/fnoApi";
import { fetchMarketHistory, fetchMarketNews } from "../api/marketApi";
import { useAsset } from "../context/AssetContext";
import SharedMultiChartGrid from "../components/trader/MultiChartGrid";
import SharedAdvancedWatchlist from "../components/trader/AdvancedWatchlist";
import AdvancedScreener from "../components/trader/AdvancedScreener";
import "./TraderDashboard.css";

const BACKEND_SYMBOL_MAP = {
  RELIANCE: "RELIANCE.NS",
  HDFCBANK: "HDFCBANK.NS",
  INFY: "INFY.NS",
  TCS: "TCS.NS",
  ICICIBANK: "ICICIBANK.NS",
  SBIN: "SBIN.NS",
  ITC: "ITC.NS",
  LT: "LT.NS",
  "NIFTY 50": "^NSEI",
  BANKNIFTY: "^NSEBANK",
  SENSEX: "^BSESN",
  "NIFTY IT": "^CNXIT",
  "NIFTY AUTO": "^CNXAUTO",
  "NIFTY INFRA": "^CNXINFRA",
  "NIFTY FIN SERVICE": "NIFTY_FIN_SERVICE.NS",
};

const BACKEND_INTERVAL_MAP = {
  "1m": "1D",
  "5m": "1D",
  "15m": "1D",
  "1h": "1D",
  "4h": "1W",
  "1D": "1M",
};

const RESEARCH_UNIVERSE = [
  "NIFTY 50",
  "BANKNIFTY",
  "RELIANCE",
  "HDFCBANK",
  "INFY",
  "TCS",
  "ICICIBANK",
  "SBIN",
  "ITC",
  "LT",
];

const SUMMARY_INDEX_UNIVERSE = ["NIFTY 50", "BANKNIFTY", "SENSEX", "NIFTY IT", "NIFTY AUTO", "NIFTY FIN SERVICE", "NIFTY INFRA"];

const FALLBACK_HEATMAP = [
  { name: "BANKING", change: 1.8 },
  { name: "IT", change: 1.3 },
  { name: "AUTO", change: 0.9 },
  { name: "METAL", change: -0.8 },
  { name: "FMCG", change: 0.6 },
  { name: "REALTY", change: -1.1 },
];

const FALLBACK_PULSE = {
  gapUp: [
    { symbol: "RELIANCE", change: "+1.40%", price: 2845 },
    { symbol: "INFY", change: "+1.05%", price: 1510 },
    { symbol: "HDFCBANK", change: "+0.92%", price: 1722 },
  ],
  gapDown: [
    { symbol: "TATASTEEL", change: "-1.10%", price: 152 },
    { symbol: "SBIN", change: "-0.86%", price: 798 },
    { symbol: "LT", change: "-0.55%", price: 3628 },
  ],
  volumeShockers: [
    { symbol: "ICICIBANK", shock: "2.3x" },
    { symbol: "AXISBANK", shock: "1.9x" },
    { symbol: "ITC", shock: "1.7x" },
  ],
};

const FALLBACK_RESEARCH_INSIGHTS = [
  {
    key: "fallback-summary-reliance",
    title: "RELIANCE",
    badge: "Setup Watch",
    badgeColor: "#42C0A5",
    kind: "summary",
    rankScore: 71,
    timeframe: "Fallback scan",
    details: [
      { name: "Bias", value: "Bullish", note: "Score 71", color: "#42C0A5" },
      { name: "RSI", value: "61.2", note: "Momentum", color: "#42C0A5" },
      { name: "MACD Δ", value: "0.82", note: "Signal spread", color: "#42C0A5" },
      { name: "Volume", value: "Above Average", note: "Participation", color: "#42C0A5" },
    ],
    note: "Fallback research view while backend insight scan is unavailable.",
  },
  {
    key: "fallback-summary-hdfcbank",
    title: "HDFCBANK",
    badge: "Support Retest",
    badgeColor: "#f0b429",
    kind: "summary",
    rankScore: 63,
    timeframe: "Fallback scan",
    details: [
      { name: "Bias", value: "Neutral", note: "Score 63", color: "#f0b429" },
      { name: "RSI", value: "53.8", note: "Momentum", color: "#f0b429" },
      { name: "MACD Δ", value: "0.18", note: "Signal spread", color: "#42C0A5" },
      { name: "Volume", value: "Average", note: "Participation", color: "#8b909a" },
    ],
    note: "Fallback insight card. Confirm with live backend feed before execution.",
  },
  {
    key: "fallback-alert-nifty",
    title: "NIFTY 50",
    badge: "Resistance Test",
    badgeColor: "#ed5750",
    kind: "alert",
    rankScore: 55,
    timeframe: "Fallback alert",
    details: [
      { name: "Trigger", value: "Resistance Test", note: "Technical alert", color: "#ed5750" },
      { name: "Price", value: "18,536", note: "Spot price", color: "#d1d4dc" },
    ],
    note: "Fallback alert generated while backend alert stream is unavailable.",
  },
];

const FALLBACK_SUMMARY = {
  score: { score: 67, bias: "bullish" },
  indicators: {
    rsi: 58.2,
    volumeStatus: "above_average",
    macd: { value: 1.84, signal: 1.22 },
    support: 18395,
    resistance: 18640,
    ema20: 18502,
    current: 18536,
  },
  trendMatrix: {
    "5m": "bullish",
    "15m": "bullish",
    "1h": "neutral",
    "4h": "bullish",
    "1d": "bullish",
  },
  patterns: [
    {
      pattern: "Ascending Triangle",
      confidence: 78,
      description: "Price compressing near resistance with steady higher lows.",
    },
  ],
};

const getBiasMeta = (bias) => {
  if (bias === "bullish") return { label: "Bullish", color: "#42C0A5", symbol: "↑" };
  if (bias === "bearish") return { label: "Bearish", color: "#ed5750", symbol: "↓" };
  return { label: "Neutral", color: "#8b909a", symbol: "→" };
};

const getImpactColor = (impact) => {
  if (String(impact).toLowerCase().includes("high")) return "#ed5750";
  if (String(impact).toLowerCase().includes("med")) return "#f0b429";
  return "#8b909a";
};

const formatSignedPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00%";
  return `${numeric > 0 ? "+" : ""}${numeric.toFixed(2)}%`;
};

const formatVolumeStatus = (value) => {
  const mapping = {
    high_volume: "High Volume",
    above_average: "Above Average",
    average: "Average",
    below_average: "Below Average",
    low_volume: "Low Volume",
  };
  return mapping[value] || "Average";
};

const formatCalendarDate = (value) => {
  if (!value) return "Today";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatNewsTime = (value) => {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const toTradeAssetType = (value) => {
  const normalized = String(value || "stock").toUpperCase();
  return ["STOCK", "CRYPTO", "FOREX"].includes(normalized) ? normalized : "STOCK";
};

const normalizeDisplaySymbol = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const upper = raw.toUpperCase();
  if (upper === "^NSEI" || upper === "NIFTY" || upper === "NIFTY50") return "NIFTY 50";
  if (upper === "^NSEBANK" || upper === "BANKNIFTY") return "BANKNIFTY";
  if (upper === "^BSESN" || upper === "SENSEX") return "SENSEX";
  if (upper === "^CNXIT" || upper === "NIFTY IT" || upper === "NIFTYIT") return "NIFTY IT";
  if (upper === "^CNXAUTO" || upper === "NIFTY AUTO" || upper === "NIFTYAUTO") return "NIFTY AUTO";
  if (upper === "^CNXINFRA" || upper === "NIFTY INFRA" || upper === "NIFTYINFRA") return "NIFTY INFRA";
  if (upper === "NIFTY_FIN_SERVICE.NS" || upper === "NIFTY_FIN_SERVICE" || upper === "NIFTY FIN SERVICE") return "NIFTY FIN SERVICE";
  return upper.replace(/\.(NS|BO)$/i, "");
};

const resolveBackendSymbol = (value) => {
  const normalized = normalizeDisplaySymbol(value);
  if (!normalized) return "";
  return BACKEND_SYMBOL_MAP[normalized] || normalized;
};

const resolveTrendBias = (value) => {
  const normalized = String(value || "neutral").toLowerCase();
  if (normalized.includes("bull")) return "bullish";
  if (normalized.includes("bear")) return "bearish";
  return "neutral";
};

const normalizePulseRows = (rows = []) => (
  (Array.isArray(rows) ? rows : [])
    .map((item) => {
      const changeRaw = Number.parseFloat(String(item?.changePercent ?? item?.change ?? 0).replace("%", ""));
      const priceRaw = Number(item?.price ?? item?.ltp ?? item?.lastPrice ?? 0);

      return {
        symbol: normalizeDisplaySymbol(item?.symbol),
        change: formatSignedPercent(Number.isFinite(changeRaw) ? changeRaw : 0),
        price: Number.isFinite(priceRaw) ? priceRaw : 0,
      };
    })
    .filter((item) => item.symbol)
);

const normalizeVolumeShockers = (rows = []) => (
  (Array.isArray(rows) ? rows : [])
    .map((item) => {
      const shockRaw = Number.parseFloat(String(item?.shock ?? "1").replace("x", ""));
      const shock = Number.isFinite(shockRaw) ? shockRaw : 1;

      return {
        symbol: normalizeDisplaySymbol(item?.symbol),
        shock: `${shock.toFixed(1)}x`,
      };
    })
    .filter((item) => item.symbol)
);

const usePreMarketPulse = () => {
  const [pulse, setPulse] = useState({ gapUp: [], gapDown: [], volumeShockers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPulse = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const response = await fetchPulse();
        if (isMounted) {
          const gapUp = normalizePulseRows(response?.gapUp);
          const gapDown = normalizePulseRows(response?.gapDown);
          const volumeShockers = normalizeVolumeShockers(response?.volumeShockers);
          const shouldFallback = gapUp.length === 0 && gapDown.length === 0 && volumeShockers.length === 0;
          if (shouldFallback) {
            setPulse(FALLBACK_PULSE);
            setIsFallback(true);
          } else {
            setPulse({ gapUp, gapDown, volumeShockers });
            setIsFallback(false);
          }
        }
      } catch (error) {
        console.error("Failed to load pre-market pulse:", error);
        if (isMounted) {
          setPulse(FALLBACK_PULSE);
          setIsFallback(true);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadPulse(false);
    const intervalId = setInterval(() => {
      loadPulse(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { pulse, isLoading, isFallback };
};

const SectorHeatmap = () => {
  const [sectors, setSectors] = useState(FALLBACK_HEATMAP);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHeatmap = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const response = await fetchHeatmap();
        const mapped = (response || [])
          .map((sector) => {
            const changes = sector.children?.map((item) => Number(item.change) || 0) || [];
            const averageChange = changes.length
              ? changes.reduce((sum, value) => sum + value, 0) / changes.length
              : 0;

            return {
              name: String(sector.name || "SECTOR").toUpperCase().slice(0, 12),
              change: Number(averageChange.toFixed(2)),
            };
          })
          .sort((a, b) => b.change - a.change)
          .slice(0, 6);

        if (isMounted) {
          setSectors(mapped.length ? mapped : FALLBACK_HEATMAP);
        }
      } catch (error) {
        console.error("Failed to load sector heatmap:", error);
        if (isMounted) {
          setSectors(FALLBACK_HEATMAP);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadHeatmap(false);
    const intervalId = setInterval(() => {
      loadHeatmap(true);
    }, 45000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="trader-card flex flex-col h-full bg-transparent border border-white/10">
      <div className="card-header flex justify-between items-center mb-1.5 px-2.5 py-1.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#9194a2]" />
          <h3 className="text-[#9194a2] font-bold text-xs tracking-wider uppercase">
            Sector Heatmap
          </h3>
        </div>
        <span className="text-[10px] text-[#5d606b]">{isLoading ? "Syncing..." : "Live basket"}</span>
      </div>
      <div className="flex-1 p-1.5 grid grid-cols-3 gap-1.5">
        {!isLoading && sectors.length === 0 && (
          <div className="col-span-3 text-[10px] text-[#5d606b] font-mono uppercase tracking-wider px-1">No backend sectors available.</div>
        )}
        {sectors.map((sector) => {
          const isPositive = sector.change > 0;
          const isNeutral = sector.change === 0;
          const backgroundClass = isNeutral
            ? "bg-[#334155]/40 border-slate-500/20"
            : isPositive
              ? "bg-[#14532d]/40 border-green-500/20"
              : "bg-[#7f1d1d]/40 border-red-500/20";
          const valueClass = isNeutral
            ? "text-slate-300"
            : isPositive
              ? "text-[#4ade80]"
              : "text-[#fecaca]";

          return (
            <motion.div
              key={sector.name}
              whileHover={{ scale: 0.98 }}
              className={`rounded-md border flex flex-col justify-center items-center relative overflow-hidden group cursor-pointer ${backgroundClass}`}
            >
              <span className="text-white font-bold text-[10px] z-10 text-center px-1.5">{sector.name}</span>
              <span className={`${valueClass} text-sm font-mono font-bold z-10`}>
                {formatSignedPercent(sector.change)}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const TrendStrengthPanel = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const symbols = ["NIFTY 50", "BANKNIFTY", "RELIANCE", "HDFCBANK", "INFY", "TCS"];

    const loadTrendMatrix = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        setHasError(false);

        const responses = await Promise.allSettled(
          symbols.map(async (symbol) => {
            const backendSymbol = resolveBackendSymbol(symbol);
            const summary = await fetchTechnicalSummary("stock", backendSymbol);
            const matrix = summary?.trendMatrix || {};
            const mapTrendState = (value) => {
              if (value === undefined || value === null || String(value).trim() === "") {
                return null;
              }
              return resolveTrendBias(value);
            };

            const mappedMatrix = {
              "5m": mapTrendState(matrix["5m"]),
              "15m": mapTrendState(matrix["15m"]),
              "1h": mapTrendState(matrix["1h"]),
              "4h": mapTrendState(matrix["4h"] ?? matrix["1h"]),
              "1d": mapTrendState(matrix["1d"]),
            };

            if (!Object.values(mappedMatrix).some(Boolean)) {
              return null;
            }

            return {
              symbol,
              matrix: mappedMatrix,
            };
          })
        );

        const nextRows = responses
          .filter((response) => response.status === "fulfilled")
          .map((response) => response.value)
          .filter(Boolean);
        const allRejected = responses.every((response) => response.status === "rejected");

        if (isMounted) {
          setRows(nextRows);
          setHasError(allRejected);
        }
      } catch (error) {
        console.error("Failed to load trend matrix:", error);
        if (isMounted) {
          setRows([]);
          setHasError(true);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadTrendMatrix(false);
    const intervalId = setInterval(() => {
      loadTrendMatrix(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const matrixRows = rows;
  const biasScore = matrixRows.reduce((acc, row) => {
    const values = Object.values(row.matrix);
    values.forEach((value) => {
      if (value === "bullish") acc += 1;
      if (value === "bearish") acc -= 1;
    });
    return acc;
  }, 0);
  const marketBias = biasScore > 0 ? "Bullish" : biasScore < 0 ? "Bearish" : "Neutral";
  const marketBiasColor = marketBias === "Bullish" ? "#42C0A5" : marketBias === "Bearish" ? "#ed5750" : "#8b909a";

  const stateToGlyph = {
    bullish: "↑",
    bearish: "↓",
    neutral: "→",
    unknown: "-",
  };

  return (
    <div className="trader-card flex flex-col h-full border border-white/10 relative" style={{ background: "rgba(255,255,255,0.03)" }}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[10px] font-mono text-[#9194a2] uppercase tracking-wider">Syncing trend matrix...</div>
      )}
      <div className="card-header flex justify-between items-center px-2.5 py-1.5 border-b border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#42C0A5] rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-[#9194a2] font-bold text-xs tracking-wider">TREND MATRIX</h3>
            <p className="text-[9px] text-[#5d606b] mt-0.5">Backend summary trend alignment</p>
          </div>
        </div>
        {hasError ? (
          <span className="text-[9px] text-[#f0b429] bg-[#f0b429]/10 px-2 py-0.5 rounded border border-[#f0b429]/20 font-bold">BACKEND OFFLINE</span>
        ) : matrixRows.length > 0 ? (
          <span className="text-[9px] text-[#42C0A5] bg-[#42C0A5]/10 px-2 py-0.5 rounded border border-[#42C0A5]/20 font-bold">● LIVE</span>
        ) : (
          <span className="text-[9px] text-[#8b909a] bg-white/5 px-2 py-0.5 rounded border border-white/10 font-bold">NO DATA</span>
        )}
      </div>

      <div className="flex-1 px-2 pb-2 pt-1 overflow-y-auto custom-scrollbar" style={{ scrollbarColor: "#2a2e39 transparent" }}>
        {!isLoading && hasError && (
          <div className="text-[10px] text-[#f0b429] font-mono uppercase tracking-wider px-1 py-2">Unable to load trend matrix from backend.</div>
        )}
        {!isLoading && !hasError && matrixRows.length === 0 && (
          <div className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider px-1 py-2">No trend matrix data from backend.</div>
        )}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="py-2 px-2 text-left text-[9px] text-[#5d606b] uppercase tracking-wider font-semibold rounded-l w-[28%]">Symbol</th>
              <th className="py-2 text-center text-[9px] text-[#5d606b] uppercase tracking-wider font-semibold">5M</th>
              <th className="py-2 text-center text-[9px] text-[#5d606b] uppercase tracking-wider font-semibold">15M</th>
              <th className="py-2 text-center text-[9px] text-[#5d606b] uppercase tracking-wider font-semibold">1H</th>
              <th className="py-2 text-center text-[9px] text-[#5d606b] uppercase tracking-wider font-semibold">4H</th>
              <th className="py-2 text-center text-[9px] text-[#5d606b] uppercase tracking-wider font-semibold rounded-r">1D</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row, idx) => {
              const values = [row.matrix["5m"], row.matrix["15m"], row.matrix["1h"], row.matrix["4h"], row.matrix["1d"]];
              const ups = values.filter((value) => value === "bullish").length;
              const downs = values.filter((value) => value === "bearish").length;
              const bias = ups > downs ? "#42C0A5" : downs > ups ? "#ed5750" : "#8b909a";

              return (
                <tr
                  key={idx}
                  className="border-b transition-colors cursor-pointer"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1a1f2e";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: bias }}></div>
                      <span className="text-white font-bold text-[10px] truncate">{normalizeDisplaySymbol(row.symbol)}</span>
                    </div>
                  </td>
                  {values.map((state, i) => {
                    const glyph = stateToGlyph[state] || stateToGlyph.unknown;
                    const color = state === "bullish" ? "#42C0A5" : state === "bearish" ? "#ed5750" : state === "neutral" ? "#8b909a" : "#5d606b";
                    const bg = state === "bullish"
                      ? "rgba(61,178,107,0.2)"
                      : state === "bearish"
                        ? "rgba(237,87,80,0.2)"
                        : state === "neutral"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.03)";

                    return (
                      <td key={i} className="py-2 text-center">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                          style={{ background: bg, color }}
                        >
                          {glyph}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-2.5 py-1.5 border-t border-white/10 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center gap-2 text-[9px]">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(61,178,107,0.2)", color: "#42C0A5" }}>↑</span>
            <span className="text-[#5d606b]">Bullish</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(237,87,80,0.2)", color: "#ed5750" }}>↓</span>
            <span className="text-[#5d606b]">Bearish</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "#8b909a" }}>→</span>
            <span className="text-[#5d606b]">Neutral</span>
          </div>
        </div>
        <div className="text-[9px] font-bold" style={{ color: marketBiasColor }}>
          Market Bias: <span>{marketBias}</span>
        </div>
      </div>
    </div>
  );
};

const GapLists = () => {
  const [activeTab, setActiveTab] = useState("GAINERS");
  const { pulse, isLoading, isFallback } = usePreMarketPulse();

  const rows = activeTab === "GAINERS"
    ? pulse.gapUp
    : pulse.gapDown;

  return (
    <div className="trader-card flex flex-col h-full bg-transparent border border-white/10">
      <div className="card-header flex justify-between items-center mb-1.5 px-2.5 py-1.5 border-b border-white/10">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("GAINERS")}
            className={`flex items-center gap-1 text-[10px] font-bold tracking-wider transition-colors ${activeTab === "GAINERS" ? "text-white" : "text-[#9194a2]"
              }`}
          >
            <TrendingUp
              size={12}
              className={
                activeTab === "GAINERS" ? "text-[#42C0A5]" : "text-gray-600"
              }
            />
            GAINERS
          </button>
          <button
            onClick={() => setActiveTab("LOSERS")}
            className={`flex items-center gap-1 text-[10px] font-bold tracking-wider transition-colors ${activeTab === "LOSERS" ? "text-white" : "text-[#9194a2]"
              }`}
          >
            <TrendingDown
              size={12}
              className={
                activeTab === "LOSERS" ? "text-[#ed5750]" : "text-gray-600"
              }
            />
            LOSERS
          </button>
        </div>
        <Maximize2
          size={10}
          className="text-[#9194a2] cursor-pointer hover:text-white"
        />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar p-2">
        {isLoading && (
          <div className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider">Refreshing pulse...</div>
        )}
        {!isLoading && isFallback && (
          <div className="text-[10px] text-[#f0b429] font-mono uppercase tracking-wider">Fallback pulse data active.</div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider">No backend pulse rows.</div>
        )}
        {rows.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center group cursor-pointer"
          >
            <div>
              <div className="font-bold text-[#e2e8f0] text-xs group-hover:text-white">
                {normalizeDisplaySymbol(item.symbol)}
              </div>
              <div className="text-[10px] text-gray-500 font-mono">{Number(item.price || 0).toLocaleString()}</div>
            </div>
            <span
              className={`${activeTab === "GAINERS" ? "text-[#42C0A5]" : "text-[#ed5750]"
                } font-mono text-xs font-bold`}
            >
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VolumeShockers = () => {
  const { pulse, isLoading, isFallback } = usePreMarketPulse();
  const items = pulse.volumeShockers.map((item, index) => ({
    symbol: normalizeDisplaySymbol(item.symbol),
    shock: item.shock,
    progress: Math.min(100, Math.max(20, Math.round((parseFloat(item.shock) || 1) * 40))),
    color: ["#bc13fe", "#3b82f6", "#10b981", "#f97316"][index % 4],
  }));

  return (
  <div className="trader-card flex flex-col h-full bg-transparent border border-white/10">
    <div className="card-header flex justify-between items-center mb-1.5 px-2.5 py-1.5 border-b border-white/10">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20">VS</div>
        <h3 className="text-[#9194a2] font-bold text-xs tracking-wider uppercase">
          VOL SHOCKERS
        </h3>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
        <span className="text-[10px] text-yellow-500 font-bold">LIVE</span>
      </div>
    </div>
    <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar p-2">
      {isLoading && (
        <div className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider">Refreshing volume spikes...</div>
      )}
      {!isLoading && isFallback && (
        <div className="text-[10px] text-[#f0b429] font-mono uppercase tracking-wider">Fallback volume shockers active.</div>
      )}
      {!isLoading && items.length === 0 && (
        <div className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider">No backend volume spikes.</div>
      )}
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex justify-between items-center group cursor-pointer"
        >
          <span className="font-bold text-[#e2e8f0] text-xs w-24 group-hover:text-white transition-colors">
            {item.symbol}
          </span>
          <div className="flex flex-1 items-center gap-2 justify-end">
            <div className="h-2 w-20 bg-white/5 rounded-full overflow-hidden relative">
              <div
                style={{ width: `${item.progress}%`, background: item.color }}
                className="h-full opacity-80 rounded-full shadow-[0_0_8px_currentColor]"
              ></div>
            </div>
            <span className="font-mono text-xs font-bold w-8 text-right" style={{ color: item.color }}>
              {item.shock}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

const KeyLevelsPanel = () => {
  const [selectedIndex, setSelectedIndex] = useState(SUMMARY_INDEX_UNIVERSE[0]);
  const [levels, setLevels] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [indexStatus, setIndexStatus] = useState(() => (
    Object.fromEntries(SUMMARY_INDEX_UNIVERSE.map((symbol) => [symbol, "loading"]))
  ));
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const pickFinite = (...values) => {
    for (const candidate of values) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }
    return null;
  };

  const buildLevelsFromPayload = (summary, depth = null) => {
    const indicators = summary?.indicators || {};
    const bid = Number(depth?.bids?.[0]?.price);
    const ask = Number(depth?.asks?.[0]?.price);
    const midpoint = Number.isFinite(bid) && bid > 0 && Number.isFinite(ask) && ask > 0
      ? (bid + ask) / 2
      : null;

    return {
      current: pickFinite(midpoint, bid, ask, indicators?.lastPrice, indicators?.current, summary?.price, summary?.ltp),
      ema20: pickFinite(indicators?.ema20, indicators?.vwap),
      support: pickFinite(indicators?.support, indicators?.support1, indicators?.s1),
      resistance: pickFinite(indicators?.resistance, indicators?.resistance1, indicators?.r1),
      weeklyHigh: pickFinite(indicators?.weeklyHigh, indicators?.high52w, indicators?.dayHigh),
      weeklyLow: pickFinite(indicators?.weeklyLow, indicators?.low52w, indicators?.dayLow),
    };
  };

  const hasAnyLiveLevel = (candidateLevels) => (
    Object.values(candidateLevels || {}).some((value) => Number.isFinite(value) && value > 0)
  );

  useEffect(() => {
    let isMounted = true;

    const loadLevels = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        setHasError(false);
        const backendSymbol = resolveBackendSymbol(selectedIndex);
        const [summaryResponse, depthResponse] = await Promise.allSettled([
          fetchTechnicalSummary("stock", backendSymbol, { strictLive: true }),
          fetchQuickOrderData(backendSymbol),
        ]);

        const summary = summaryResponse.status === "fulfilled" ? summaryResponse.value : null;
        const depth = depthResponse.status === "fulfilled" ? depthResponse.value : null;
        const nextLevels = buildLevelsFromPayload(summary, depth);
        const hasAnyLevel = hasAnyLiveLevel(nextLevels);
        const allRejected = summaryResponse.status === "rejected" && depthResponse.status === "rejected";

        if (isMounted) {
          setLevels(hasAnyLevel ? nextLevels : null);
          setHasError(allRejected);
        }
      } catch (error) {
        console.error("Failed to load key levels:", error);
        if (isMounted) {
          setLevels(null);
          setHasError(true);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadLevels(false);
    const intervalId = setInterval(() => {
      loadLevels(true);
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selectedIndex]);

  useEffect(() => {
    let isMounted = true;

    const loadIndexStatus = async (silent = false) => {
      if (!silent) {
        setIsStatusLoading(true);
      }

      try {
        const settled = await Promise.allSettled(
          SUMMARY_INDEX_UNIVERSE.map(async (symbol) => {
            const backendSymbol = resolveBackendSymbol(symbol);
            const summary = await fetchTechnicalSummary("stock", backendSymbol, { strictLive: true });
            const previewLevels = buildLevelsFromPayload(summary, null);
            return {
              symbol,
              hasLive: hasAnyLiveLevel(previewLevels),
            };
          })
        );

        if (isMounted) {
          const nextStatus = {};
          settled.forEach((entry, index) => {
            const symbol = SUMMARY_INDEX_UNIVERSE[index];
            if (entry.status === "fulfilled") {
              nextStatus[symbol] = entry.value.hasLive ? "live" : "no-data";
            } else {
              nextStatus[symbol] = "offline";
            }
          });
          setIndexStatus(nextStatus);
        }
      } catch (error) {
        if (isMounted) {
          setIndexStatus(Object.fromEntries(SUMMARY_INDEX_UNIVERSE.map((symbol) => [symbol, "offline"])));
        }
      } finally {
        if (isMounted && !silent) {
          setIsStatusLoading(false);
        }
      }
    };

    loadIndexStatus(false);
    const intervalId = setInterval(() => {
      loadIndexStatus(true);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const rows = [
    { label: "Resistance", value: levels?.resistance, color: "text-[#ed5750]", icon: "R", bg: "bg-[#ed5750]/10" },
    { label: "VWAP", value: levels?.ema20, color: "text-[#8b909a]", icon: "V", bg: "bg-white/5" },
    { label: "Current", value: levels?.current, color: "text-[#d1d4dc]", icon: "C", bg: "bg-blue-500/10" },
    { label: "Support", value: levels?.support, color: "text-[#42C0A5]", icon: "S", bg: "bg-[#42C0A5]/10" },
    { label: "Weekly High", value: levels?.weeklyHigh, color: "text-[#8b909a]", icon: "H", bg: "bg-white/5" },
    { label: "Weekly Low", value: levels?.weeklyLow, color: "text-[#8b909a]", icon: "L", bg: "bg-white/5" },
  ];
  const hasLiveLevels = rows.some((row) => Number.isFinite(row.value) && row.value > 0);

  return (
  <div className="trader-card flex flex-col h-full bg-gradient-to-br from-[#131722] to-[#1a1e2e] border border-white/10 relative">
    {isLoading && (
      <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[10px] font-mono text-[#9194a2] uppercase tracking-wider">Loading levels...</div>
    )}
    <div className="card-header flex justify-between items-center mb-2.5 px-2.5 py-2 bg-gradient-to-r from-[#2a2e39] to-[#1f232e] border-b border-white/10">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-[#42C0A5] rounded-full animate-pulse"></div>
        <h3 className="text-[#9194a2] font-bold text-xs tracking-wider">
          KEY LEVELS
        </h3>
      </div>
      <div className="flex flex-col items-end gap-1">
        <select
          value={selectedIndex}
          onChange={(event) => setSelectedIndex(event.target.value)}
          className="text-[10px] font-semibold px-2 py-1 rounded-md outline-none"
          style={{
            background: "rgba(17, 24, 39, 0.9)",
            color: "#d1d4dc",
            border: "1px solid rgba(255,255,255,0.12)",
            minWidth: "128px",
          }}
        >
          {SUMMARY_INDEX_UNIVERSE.map((symbol) => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          {SUMMARY_INDEX_UNIVERSE.map((symbol) => {
            const status = isStatusLoading ? "loading" : (indexStatus[symbol] || "no-data");
            const isSelected = symbol === selectedIndex;
            const dotColor = status === "live"
              ? "#42C0A5"
              : status === "offline"
                ? "#f0b429"
                : status === "loading"
                  ? "#5d606b"
                  : "#8b909a";
            const statusLabel = status === "live"
              ? "LIVE"
              : status === "offline"
                ? "OFFLINE"
                : status === "loading"
                  ? "CHECKING"
                  : "NO DATA";

            return (
              <button
                key={symbol}
                type="button"
                onClick={() => setSelectedIndex(symbol)}
                title={`${symbol}: ${statusLabel}`}
                className="w-2.5 h-2.5 rounded-full border transition-transform"
                style={{
                  background: dotColor,
                  borderColor: isSelected ? "rgba(209,212,220,0.95)" : "rgba(255,255,255,0.18)",
                  transform: isSelected ? "scale(1.2)" : "scale(1)",
                }}
              />
            );
          })}
          <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${hasError ? "text-[#f0b429] bg-[#f0b429]/10 border-[#f0b429]/20" : hasLiveLevels ? "text-[#42C0A5] bg-[#42C0A5]/10 border-[#42C0A5]/20" : "text-[#8b909a] bg-white/5 border-white/10"}`}>{hasError ? "BACKEND OFFLINE" : hasLiveLevels ? "LIVE" : "NO DATA"}</span>
        </div>
      </div>
    </div>
    <div className="flex-1 px-2.5 pb-2.5 space-y-2">
      {!isLoading && hasError && (
        <div className="text-[10px] text-[#f0b429] font-mono uppercase tracking-wider text-center py-2">Unable to load key levels from backend.</div>
      )}
      {!isLoading && !hasError && !hasLiveLevels && (
        <div className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider text-center py-2">No backend key levels available.</div>
      )}
      {rows.map((row, idx) => (
        <div key={idx} className={`flex justify-between items-center text-xs ${row.bg} rounded-lg p-2 hover:scale-[1.02] transition-transform`}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] font-bold text-[#cfd3df] bg-white/10 border border-white/10">{row.icon}</span>
            <span className="text-[#8b909a] uppercase text-[10px] tracking-wider font-semibold">{row.label}</span>
          </div>
          <span className={`font-mono font-bold text-sm ${Number.isFinite(row.value) && row.value > 0 ? row.color : "text-[#8b909a]"}`}>
            {Number.isFinite(row.value) && row.value > 0 ? Number(row.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "--"}
          </span>
        </div>
      ))}
    </div>
  </div>
  );
};

const InstrumentSummaryPanel = () => {
  const { activeType } = useAsset();
  const [summary, setSummary] = useState(null);
  const [hasVerifiedSummary, setHasVerifiedSummary] = useState(false);
  const [hasSummaryError, setHasSummaryError] = useState(false);
  const [indexSnapshots, setIndexSnapshots] = useState([]);
  const [summarySymbol, setSummarySymbol] = useState(SUMMARY_INDEX_UNIVERSE[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        setHasSummaryError(false);
        const settled = await Promise.allSettled(
          SUMMARY_INDEX_UNIVERSE.map(async (symbol) => {
            const backendSymbol = resolveBackendSymbol(symbol);
            const response = await fetchTechnicalSummary(activeType, backendSymbol, { strictLive: true });
            const verified = Boolean(response?.indicators || response?.score);
            return {
              symbol,
              summary: verified ? response : null,
              verified,
            };
          })
        );

        if (isMounted) {
          const snapshots = settled
            .map((entry, index) => {
              if (entry.status === "fulfilled") {
                return entry.value;
              }
              return {
                symbol: SUMMARY_INDEX_UNIVERSE[index],
                summary: null,
                verified: false,
              };
            });

          setIndexSnapshots(snapshots);

          const current = snapshots.find((item) => item.symbol === summarySymbol && item.verified);
          const firstVerified = snapshots.find((item) => item.verified);
          const selected = current || firstVerified || snapshots[0] || null;

          setSummarySymbol(selected?.symbol || SUMMARY_INDEX_UNIVERSE[0]);
          setSummary(selected?.summary || null);
          setHasVerifiedSummary(Boolean(selected?.verified));
          setHasSummaryError(snapshots.every((item) => !item.verified));
        }
      } catch (error) {
        console.error("Failed to load technical summary:", error);
        if (isMounted) {
          setSummary(null);
          setHasVerifiedSummary(false);
          setIndexSnapshots(
            SUMMARY_INDEX_UNIVERSE.map((symbol) => ({
              symbol,
              summary: null,
              verified: false,
            }))
          );
          setHasSummaryError(true);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadSummary(false);
    const intervalId = setInterval(() => {
      loadSummary(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [activeType, summarySymbol]);

  const score = Number(summary?.score?.score || 0);
  const biasMeta = getBiasMeta(summary?.score?.bias || "neutral");
  const indicators = summary?.indicators || {};
  const sessionChange = Number(indicators?.lastChangePercent);
  const sessionChangeText = Number.isFinite(sessionChange) ? formatSignedPercent(sessionChange) : "--";
  const sessionChangeColor = Number.isFinite(sessionChange)
    ? (sessionChange > 0 ? "#42C0A5" : sessionChange < 0 ? "#ed5750" : "#8b909a")
    : "#8b909a";
  const lastUpdatedText = indicators?.lastUpdatedAt
    ? new Date(indicators.lastUpdatedAt).toLocaleString()
    : "No timestamp";
  const trendMatrix = summary?.trendMatrix || {};
  const patterns = summary?.patterns?.length ? summary.patterns : [];
  const bullishCount = Object.values(trendMatrix).filter((value) => value === "bullish").length;
  const macdDiff = indicators?.macd ? indicators.macd.value - indicators.macd.signal : 0;
  const summaryOptions = indexSnapshots.length
    ? indexSnapshots
    : SUMMARY_INDEX_UNIVERSE.map((symbol) => ({
      symbol,
      summary: null,
      verified: false,
    }));
  const selectedSnapshot = summaryOptions.find((item) => item.symbol === summarySymbol) || summaryOptions[0] || null;

  const handleSummarySymbolChange = (nextSymbol) => {
    setSummarySymbol(nextSymbol);
    const nextSnapshot = summaryOptions.find((item) => item.symbol === nextSymbol) || null;
    setSummary(nextSnapshot?.summary || null);
    setHasVerifiedSummary(Boolean(nextSnapshot?.verified));
  };

  const metrics = [
    { label: "Trend", value: hasVerifiedSummary ? biasMeta.label : "--", color: hasVerifiedSummary ? biasMeta.color : "#8b909a", icon: "TR", progress: hasVerifiedSummary ? Math.max(0, bullishCount * 25) : 0, sub: hasVerifiedSummary ? `${bullishCount}/4 timeframes aligned` : "No verified trend matrix" },
    { label: "Momentum", value: hasVerifiedSummary && Number.isFinite(Number(indicators?.rsi)) ? `RSI ${Number(indicators.rsi).toFixed(1)}` : "--", color: hasVerifiedSummary ? (indicators?.rsi >= 60 ? "#42C0A5" : indicators?.rsi <= 40 ? "#ed5750" : "#f0b429") : "#8b909a", icon: "MO", progress: hasVerifiedSummary && Number.isFinite(Number(indicators?.rsi)) ? Math.min(100, Math.round(Number(indicators.rsi))) : 0, sub: hasVerifiedSummary ? (macdDiff >= 0 ? "MACD crossover positive" : "MACD pressure negative") : "No verified momentum" },
    { label: "Volume", value: hasVerifiedSummary ? formatVolumeStatus(indicators?.volumeStatus) : "--", color: hasVerifiedSummary ? "#42C0A5" : "#8b909a", icon: "VO", progress: hasVerifiedSummary ? ({ high_volume: 95, above_average: 78, average: 55, below_average: 35, low_volume: 20 }[indicators?.volumeStatus] || 55) : 0, sub: hasVerifiedSummary ? "20-period participation" : "No verified volume status" },
    { label: "Pattern", value: hasVerifiedSummary ? (patterns[0]?.pattern || "No verified pattern") : "--", color: hasVerifiedSummary ? "#f0b429" : "#8b909a", icon: "PT", progress: hasVerifiedSummary ? (patterns[0]?.confidence || 0) : 0, sub: hasVerifiedSummary ? (patterns[0]?.description || "No pattern payload from backend") : "No verified pattern payload" },
    { label: "Session Change", value: hasVerifiedSummary ? sessionChangeText : "--", color: hasVerifiedSummary ? sessionChangeColor : "#8b909a", icon: "CH", progress: hasVerifiedSummary && Number.isFinite(sessionChange) ? Math.min(100, Math.abs(sessionChange) * 20) : 0, sub: hasVerifiedSummary ? "Last closed bar vs prior bar" : "No verified session change" },
    { label: "Strength Score", value: hasVerifiedSummary ? `${score} / 100` : "--", color: hasVerifiedSummary ? biasMeta.color : "#8b909a", icon: "SC", progress: hasVerifiedSummary ? score : 0, sub: hasVerifiedSummary ? `Composite bias: ${biasMeta.label}` : "No verified composite score" },
  ];

  return (
  <div
    className="trader-card flex flex-col h-full border border-white/10 relative overflow-hidden"
    style={{
      background: 'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 55%, rgba(255,255,255,0.01) 100%)',
      boxShadow: '0 20px 45px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
    }}
  >
    {isLoading && (
      <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[11px] font-mono text-[#9194a2] uppercase tracking-wider">Syncing summary...</div>
    )}
    {}
    <div className="card-header flex justify-between items-center px-2.5 py-1.5 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-[#42C0A5] rounded-full animate-pulse"></div>
        <div>
          <h3 className="text-[#9194a2] font-bold text-sm tracking-wider">INSTRUMENT SUMMARY</h3>
          <p className="text-[11px] text-[#5d606b] mt-0.5">Technical health across key indices</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[22px] font-black" style={{ color: hasVerifiedSummary ? biasMeta.color : "#8b909a" }}>{hasVerifiedSummary ? score : "--"}</span>
        <span className="text-[10px] text-[#5d606b] uppercase tracking-wider">Score</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hasVerifiedSummary ? "text-[#42C0A5] bg-[#42C0A5]/15" : "text-[#f0b429] bg-[#f0b429]/15"}`}>{hasVerifiedSummary ? "VERIFIED" : "NO VERIFIED FEED"}</span>
      </div>
    </div>

    {}
    <div className="flex-1 px-2.5 pb-2 pt-1.5 space-y-1.5 overflow-y-auto custom-scrollbar">
      <div className="rounded-lg p-2.5 border" style={{ background: "#131722", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#7f8591] uppercase tracking-wider font-semibold">Select Index</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedSnapshot?.verified ? "text-[#42C0A5] bg-[#42C0A5]/15" : "text-[#f0b429] bg-[#f0b429]/15"}`}>
            {selectedSnapshot?.verified ? "VERIFIED" : "NO FEED"}
          </span>
        </div>
        <select
          value={summarySymbol}
          onChange={(event) => handleSummarySymbolChange(event.target.value)}
          className="w-full mt-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold outline-none"
          style={{
            background: "rgba(17, 24, 39, 0.9)",
            color: "#d1d4dc",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {summaryOptions.map((item) => (
            <option key={item.symbol} value={item.symbol}>
              {item.symbol}{item.verified ? " - VERIFIED" : " - NO FEED"}
            </option>
          ))}
        </select>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px]" style={{ color: selectedSnapshot?.verified ? getBiasMeta(selectedSnapshot?.summary?.score?.bias || "neutral").color : "#8b909a" }}>
            {selectedSnapshot?.verified ? getBiasMeta(selectedSnapshot?.summary?.score?.bias || "neutral").label : "--"}
          </span>
          <span className="text-[13px] font-mono font-bold" style={{ color: selectedSnapshot?.verified ? getBiasMeta(selectedSnapshot?.summary?.score?.bias || "neutral").color : "#8b909a" }}>
            {selectedSnapshot?.verified ? Number(selectedSnapshot?.summary?.score?.score || 0) : "--"}
          </span>
        </div>
      </div>

      {!isLoading && hasSummaryError && (
        <div className="text-[12px] text-[#f0b429] font-mono uppercase tracking-wider text-center py-2">Unable to load verified summary from backend.</div>
      )}
      {!isLoading && !hasSummaryError && !hasVerifiedSummary && (
        <div className="text-[12px] text-[#5d606b] font-mono uppercase tracking-wider text-center py-2">No verified technical summary available.</div>
      )}
      {metrics.map((row, idx) => (
        <div key={idx} className="rounded-lg p-2.5 transition-all" style={{ background: '#131722', borderTop: '1px solid rgba(255,255,255,0.07)', borderRight: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[11px] font-bold text-[#d1d4dc] bg-white/10 border border-white/10">{row.icon}</span>
              <div>
                <span className="text-[#9ca3af] uppercase text-[11px] tracking-wider font-semibold">{row.label}</span>
                <div className="text-[10px] text-[#4b5563] mt-0.5">{row.sub}</div>
              </div>
            </div>
            <span className="font-bold text-[14px] font-mono" style={{ color: row.color }}>{row.value}</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${row.progress}%`,
                background: row.progress >= 75
                  ? 'linear-gradient(90deg, #42C0A5, #6FFFE9)'
                  : row.progress >= 50
                    ? 'linear-gradient(90deg, #d97706, #f0b429)'
                    : 'linear-gradient(90deg, #6b7280, #9ca3af)',
                boxShadow: row.progress >= 75 ? '0 0 6px rgba(61,178,107,0.4)' : 'none',
              }}
            />
          </div>
        </div>
      ))}
    </div>

    {}
    <div className="px-2.5 py-1.5 border-t border-white/10 flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <span className="text-[10px] text-[#5d606b]">Source: technical summary API (verified feed) | Updated: {hasVerifiedSummary ? lastUpdatedText : "--"}</span>
      <span className="text-[11px] font-bold" style={{ color: hasVerifiedSummary ? biasMeta.color : "#8b909a" }}>Overall: {hasVerifiedSummary ? `${biasMeta.label} ${biasMeta.symbol}` : "--"}</span>
    </div>
  </div>
  );
};


const SignalEnginePanel = () => {
  const { activeSymbol, activeType } = useAsset();
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadInsights = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const [watchlistResponse, alertsResponse, signalsResponse] = await Promise.allSettled([
          fetchWatchlistTechnicals(),
          fetchBreakoutAlerts(),
          fetchIndicatorSignals(),
        ]);

        const watchlistSymbols = (watchlistResponse.status === "fulfilled" ? watchlistResponse.value : [])
          .map((item) => normalizeDisplaySymbol(item?.symbol || ""))
          .filter(Boolean);

        const symbolsToScan = Array.from(
          new Set([
            normalizeDisplaySymbol(activeSymbol),
            ...watchlistSymbols,
            ...RESEARCH_UNIVERSE,
          ])
        )
          .filter(Boolean)
          .slice(0, 10);

        const toOpportunityScore = ({ summary, indicators, pattern, bias, macdDelta }) => {
          const baseScore = Number(summary?.score?.score || 50);
          const confidence = Number(pattern?.confidence || 0);
          const rsi = Number(indicators?.rsi || 50);
          const rsiBonus = rsi >= 55 && rsi <= 70 ? 8 : rsi > 70 ? 4 : rsi <= 40 ? -6 : 0;
          const macdBonus = macdDelta >= 0 ? 7 : -5;
          const biasBonus = bias === "bullish" ? 10 : bias === "bearish" ? -8 : 0;
          const volumeBonus = ["high_volume", "above_average"].includes(indicators?.volumeStatus) ? 6 : 0;

          return baseScore + confidence * 0.2 + rsiBonus + macdBonus + biasBonus + volumeBonus;
        };

        const summaryResponses = await Promise.allSettled(
          symbolsToScan.map(async (symbol) => {
            const backendSymbol = resolveBackendSymbol(symbol);
            const summary = await fetchTechnicalSummary("stock", backendSymbol);

            return {
              symbol,
              summary,
            };
          })
        );

        const nextInsights = [];
        summaryResponses
          .filter((response) => response.status === "fulfilled")
          .forEach((response) => {
            const symbol = response.value.symbol;
            const summary = response.value.summary;
            if (!(summary?.indicators || summary?.score)) {
              return;
            }

            const biasMeta = getBiasMeta(summary?.score?.bias || "neutral");
            const leadPattern = summary?.patterns?.[0] || null;
            const leadIndicators = summary?.indicators || {};
            const macdDelta = leadIndicators?.macd
              ? Number(leadIndicators.macd.value || 0) - Number(leadIndicators.macd.signal || 0)
              : 0;
            const rankScore = toOpportunityScore({
              summary,
              indicators: leadIndicators,
              pattern: leadPattern,
              bias: summary?.score?.bias,
              macdDelta,
            });

            nextInsights.push({
              key: `summary-${symbol}`,
              title: normalizeDisplaySymbol(symbol),
              badge: leadPattern?.pattern || "Setup Watch",
              badgeColor: biasMeta.color,
              kind: "summary",
              rankScore,
              timeframe: "Backend scan",
              details: [
                { name: "Bias", value: biasMeta.label, note: `Score ${summary?.score?.score ?? "--"}`, color: biasMeta.color },
                { name: "RSI", value: Number(leadIndicators.rsi || 0).toFixed(1), note: "Momentum", color: leadIndicators.rsi >= 60 ? "#42C0A5" : leadIndicators.rsi <= 40 ? "#ed5750" : "#f0b429" },
                { name: "MACD Δ", value: macdDelta.toFixed(2), note: "Signal spread", color: macdDelta >= 0 ? "#42C0A5" : "#ed5750" },
                { name: "Volume", value: formatVolumeStatus(leadIndicators.volumeStatus), note: "Participation", color: "#42C0A5" },
              ],
              note: leadPattern?.description || `${normalizeDisplaySymbol(symbol)} technical snapshot sourced from backend summary API.`,
            });
          });

        if (alertsResponse.status === "fulfilled") {
          alertsResponse.value.slice(0, 3).forEach((alert) => {
            nextInsights.push({
              key: `alert-${alert.symbol}-${alert.time}`,
              title: alert.symbol,
              badge: alert.type,
              badgeColor: "#42C0A5",
              kind: "alert",
              rankScore: 35,
              timeframe: alert.time,
              details: [
                { name: "Trigger", value: alert.type, note: "Technical alert", color: "#42C0A5" },
                { name: "Price", value: Number(alert.price || 0).toLocaleString(), note: "Spot price", color: "#d1d4dc" },
              ],
              note: `${alert.symbol} flashed a live breakout condition at ${alert.time}.`,
            });
          });
        }

        if (signalsResponse.status === "fulfilled") {
          signalsResponse.value.slice(0, 2).forEach((signal) => {
            nextInsights.push({
              key: `signal-${signal.symbol}`,
              title: signal.symbol,
              badge: signal.value,
              badgeColor: "#f0b429",
              kind: "signal",
              rankScore: 30,
              timeframe: "Market scan",
              details: [
                { name: "Signal", value: signal.value, note: "Active condition", color: "#f0b429" },
                { name: "Stocks", value: signal.stocks?.join(", ") || "N/A", note: "Current matches", color: "#42C0A5" },
              ],
              note: `${signal.symbol} scan currently flags ${signal.stocks?.join(", ") || "selected symbols"}.`,
            });
          });
        }

        if (isMounted) {
          const prioritized = [...nextInsights].sort((a, b) => {
            const kindPriority = { summary: 0, alert: 1, signal: 2 };
            const aKind = kindPriority[a.kind] ?? 9;
            const bKind = kindPriority[b.kind] ?? 9;

            if (aKind !== bKind) {
              return aKind - bKind;
            }

            return Number(b.rankScore || 0) - Number(a.rankScore || 0);
          });

          if (prioritized.length > 0) {
            setInsights(prioritized.slice(0, 12));
            setIsFallback(false);
          } else {
            setInsights(FALLBACK_RESEARCH_INSIGHTS);
            setIsFallback(true);
          }
        }
      } catch (error) {
        console.error("Failed to load research insights:", error);
        if (isMounted) {
          setInsights(FALLBACK_RESEARCH_INSIGHTS);
          setIsFallback(true);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadInsights(false);
    const intervalId = setInterval(() => {
      loadInsights(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [activeSymbol, activeType]);

  return (
  <div className="trader-card flex flex-col h-full border border-white/10 relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
    {isLoading && (
      <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[10px] font-mono text-[#9194a2] uppercase tracking-wider">Scanning insights...</div>
    )}
    <div
      className="card-header flex justify-between items-center px-2.5 py-1.5 border-b border-white/10"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[#42C0A5] rounded-full animate-pulse shadow-[0_0_12px_rgba(66,192,165,0.55)]"></div>
        <h3 className="text-[#cfd3df] font-semibold text-sm tracking-[0.18em]">RESEARCH INSIGHTS</h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#8b909a] italic">For informational use only</span>
        {isFallback ? (
          <span className="text-[10px] text-[#f0b429] bg-[#f0b429]/15 px-2 py-0.5 rounded-full border border-[#f0b429]/30 font-bold">FALLBACK DATA</span>
        ) : (
          <span className="text-[10px] text-[#42C0A5] bg-[#42C0A5]/15 px-2 py-0.5 rounded-full border border-[#42C0A5]/30 font-bold">● LIVE</span>
        )}
      </div>
    </div>

    <div className="flex-1 px-2.5 pb-2 pt-1.5 space-y-2 overflow-y-auto custom-scrollbar">
      {!isLoading && isFallback && (
        <div className="text-[10px] text-[#f0b429] font-mono uppercase tracking-wider">
          Fallback research insights active.
        </div>
      )}
      {insights.map((item) => (
        <div
          key={item.key}
          className="rounded-lg p-2 transition-all duration-200"
          style={{
            borderTop: `1px solid ${item.badgeColor}5a`,
            borderRight: `1px solid ${item.badgeColor}4a`,
            borderBottom: `1px solid ${item.badgeColor}3a`,
            borderLeft: `1px solid ${item.badgeColor}5a`,
            background: `linear-gradient(155deg, ${item.badgeColor}18 0%, rgba(255,255,255,0.035) 55%, rgba(255,255,255,0.02) 100%)`,
            boxShadow: `0 12px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px ${item.badgeColor}1e`,
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-[13px] tracking-wide">{item.title}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: item.badgeColor, background: `${item.badgeColor}24`, borderTop: `1px solid ${item.badgeColor}50`, borderRight: `1px solid ${item.badgeColor}50`, borderBottom: `1px solid ${item.badgeColor}50`, borderLeft: `1px solid ${item.badgeColor}50` }}
              >
                {item.badge}
              </span>
            </div>
            <span className="text-[10px] text-[#a6abba] bg-white/10 px-2 py-0.5 rounded-full font-mono border border-white/10">{item.timeframe}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.details.map((ind, i) => (
              <div key={i} className="rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.09)', borderTop: '1px solid rgba(255,255,255,0.18)', borderRight: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.12)', borderLeft: '1px solid rgba(255,255,255,0.18)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-[#8f96aa] uppercase tracking-[0.12em] font-semibold">{ind.name}</span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: ind.color }}>{ind.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg px-2.5 py-2"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 100%)',
              borderTop: '1px solid rgba(255,255,255,0.16)',
              borderRight: '1px solid rgba(255,255,255,0.12)',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              borderLeft: `3px solid ${item.badgeColor}`,
            }}
          >
            <p className="text-[11px] text-[#c2c8d7] leading-snug truncate">{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};


const CatalystPanel = () => {
  const [events, setEvents] = useState([]);
  const [eventsSource, setEventsSource] = useState("none");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        setHasError(false);
        const response = await fetchEconomicCalendar();
        if (isMounted) {
          const sourceEvents = Array.isArray(response) ? response : [];
          const validEvents = sourceEvents.filter((item) => item?.event && item?.date);
          const verifiedEvents = validEvents.filter((item) => item?.factual === true || String(item?.source || "").toLowerCase().includes("tradingeconomics"));

          if (verifiedEvents.length > 0) {
            setEvents(verifiedEvents.slice(0, 6));
            setEventsSource("verified");
          } else {
            setEvents([]);
            setEventsSource("none");
          }
        }
      } catch (error) {
        console.error("Failed to load catalyst events:", error);
        if (isMounted) {
          setEvents([]);
          setEventsSource("none");
          setHasError(true);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadEvents(false);
    const intervalId = setInterval(() => {
      loadEvents(true);
    }, 180000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
  <div className="trader-card flex flex-col h-full border border-white/10 relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
    {isLoading && (
      <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[10px] font-mono text-[#9194a2] uppercase tracking-wider">Loading catalysts...</div>
    )}
    {}
      <div className="card-header flex justify-between items-center px-2.5 py-1.5 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#42C0A5] rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-[#9194a2] font-bold text-base tracking-wider">MARKET CATALYSTS</h3>
            <p className="text-[11px] text-[#5d606b] mt-0.5">Verified macro events from provider feed</p>
          </div>
        </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#f0b429] bg-[#f0b429]/10 px-2 py-0.5 rounded border border-[#f0b429]/20 font-bold">{events.length ? formatCalendarDate(events[0]?.date) : "NO VERIFIED FEED"}</span>
      </div>
    </div>

    {}
    <div className="flex-1 px-2.5 pb-1.5 pt-1.5 space-y-1.5 overflow-y-auto custom-scrollbar">
      {!isLoading && hasError && (
        <div className="text-[12px] text-[#f0b429] font-mono uppercase tracking-wider">Unable to load verified catalyst events from backend.</div>
      )}
      {!isLoading && !hasError && events.length === 0 && (
        <div className="text-[12px] text-[#5d606b] font-mono uppercase tracking-wider">No verified catalyst events available.</div>
      )}
      {events.map((item, idx) => {
        const impactColor = getImpactColor(item.impact);
        const metadata = [
          item?.country ? String(item.country).toUpperCase() : null,
          item?.actual && item.actual !== "-" ? `Actual ${item.actual}` : null,
          item?.forecast && item.forecast !== "-" ? `Forecast ${item.forecast}` : null,
          item?.previous && item.previous !== "-" ? `Prev ${item.previous}` : null,
        ].filter(Boolean).join(" · ");
        return (
        <div
          key={idx}
          className="rounded-lg p-2.5 transition-all cursor-pointer"
          style={{
            background: '#131722',
            borderTop: `1px solid ${impactColor}30`,
            borderRight: `1px solid ${impactColor}30`,
            borderBottom: `1px solid ${impactColor}30`,
            borderLeft: `3px solid ${impactColor}`,
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-base mt-0.5 flex-shrink-0">{String(item.impact).toLowerCase().includes("high") ? "⚠️" : String(item.impact).toLowerCase().includes("med") ? "🕒" : "📌"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[15px] text-white font-semibold leading-tight">{item.event}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: impactColor, background: `${impactColor}18` }}
                >
                  {item.impact}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 text-[#42C0A5] bg-[#42C0A5]/15">
                  VERIFIED
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-mono text-[#7b8190]">{formatCalendarDate(item.date)}</span>
                {metadata ? (
                  <>
                    <span className="text-[#2a2e39]">·</span>
                    <span className="text-[11px] text-[#7b8190]">{metadata}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#2a2e39]">·</span>
                    <span className="text-[11px] text-[#7b8190]">Verified event schedule</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )})}
    </div>

    {}
    <div className="px-2.5 py-1.5 border-t border-white/10 flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <span className="text-[11px] text-[#5d606b]">{events.length} {eventsSource === "verified" ? "verified" : "loaded"} events</span>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-[#ed5750] font-bold">{events.filter((event) => String(event.impact).toLowerCase().includes("high")).length} HIGH</span>
        <span className="text-[#f0b429] font-bold">{events.filter((event) => String(event.impact).toLowerCase().includes("med")).length} MED</span>
        <span className="text-[#5d606b]">{events.filter((event) => !String(event.impact).toLowerCase().includes("high") && !String(event.impact).toLowerCase().includes("med")).length} LOW</span>
      </div>
    </div>
  </div>
  );
};


const TechnicalScreeners = () => {
  const [activeTab, setActiveTab] = useState("BREAKOUT");
  const [breakoutAlerts, setBreakoutAlerts] = useState([]);
  const [indicatorSignals, setIndicatorSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasBreakoutError, setHasBreakoutError] = useState(false);
  const [hasSignalsError, setHasSignalsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadScreeners = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        setHasBreakoutError(false);
        setHasSignalsError(false);
        const [alertsResponse, signalsResponse] = await Promise.allSettled([
          fetchBreakoutAlerts(),
          fetchIndicatorSignals(),
        ]);

        const normalizeBreakouts = (payload) => {
          const source = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.alerts)
                ? payload.alerts
                : [];

          return source
            .map((item) => {
              const symbol = normalizeDisplaySymbol(item?.symbol || item?.ticker || item?.name);
              if (!symbol) return null;

              const rawPrice = Number(item?.price ?? item?.ltp ?? item?.value);

              return {
                symbol,
                type: String(item?.type || item?.signal || item?.pattern || "Signal"),
                price: Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : null,
                time: item?.time || item?.timestamp || item?.date || null,
              };
            })
            .filter(Boolean);
        };

        const normalizeSignals = (payload) => {
          const source = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.signals)
                ? payload.signals
                : [];

          return source
            .map((item) => {
              const label = String(item?.symbol || item?.name || item?.signal || "").trim();
              if (!label) return null;

              const stocks = Array.isArray(item?.stocks)
                ? item.stocks.map((stock) => normalizeDisplaySymbol(stock)).filter(Boolean)
                : item?.stock
                  ? [normalizeDisplaySymbol(item.stock)].filter(Boolean)
                  : [];

              return {
                symbol: label,
                value: String(item?.value || item?.type || item?.description || "Signal"),
                stocks,
              };
            })
            .filter(Boolean);
        };

        if (isMounted) {
          const nextBreakouts = alertsResponse.status === "fulfilled"
            ? normalizeBreakouts(alertsResponse.value)
            : [];
          const nextSignals = signalsResponse.status === "fulfilled"
            ? normalizeSignals(signalsResponse.value)
            : [];

          setBreakoutAlerts(nextBreakouts);
          setIndicatorSignals(nextSignals);
          setHasBreakoutError(alertsResponse.status === "rejected");
          setHasSignalsError(signalsResponse.status === "rejected");
        }
      } catch (error) {
        console.error("Failed to load technical screeners:", error);
        if (isMounted) {
          setBreakoutAlerts([]);
          setIndicatorSignals([]);
          setHasBreakoutError(true);
          setHasSignalsError(true);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadScreeners(false);
    const intervalId = setInterval(() => {
      loadScreeners(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="trader-card flex flex-col h-full bg-transparent border border-white/10 overflow-hidden">
      <div className="flex border-b border-white/10 mb-2 bg-white/5">
        <button
          onClick={() => setActiveTab("BREAKOUT")}
          className={`px-2.5 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === "BREAKOUT"
            ? "border-b-2 border-[#42C0A5] text-[#42C0A5] bg-white/10/50"
            : "border-transparent text-[#9194a2] hover:text-[#e2e8f0]"
            }`}
        >
          Breakout Alerts
        </button>
        <button
          onClick={() => setActiveTab("INDICATOR")}
          className={`px-2.5 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === "INDICATOR"
            ? "border-b-2 border-[#42C0A5] text-[#42C0A5] bg-white/10/50"
            : "border-transparent text-[#9194a2] hover:text-[#e2e8f0]"
            }`}
        >
          Indicator Signals
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {activeTab === "BREAKOUT" ? (
          <div className="space-y-1">
            {isLoading && (
              <div className="text-[#9194a2] text-sm text-center py-4">Loading live breakout alerts...</div>
            )}
            {!isLoading && breakoutAlerts.length === 0 && (
              <div className="text-[#9194a2] text-sm text-center py-4">{hasBreakoutError ? "Unable to load breakout alerts." : "No breakout alerts from backend."}</div>
            )}
            {breakoutAlerts.map((item, k) => (
              <div
                key={k}
                className="flex justify-between items-center p-2.5 rounded hover:bg-white/10/50 text-xs border-b border-white/10/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#5d606b] font-mono text-xs">
                    {item.time || "--"}
                  </span>
                  <span className="font-bold text-[#e2e8f0] text-sm w-24">
                    {item.symbol}
                  </span>
                  <span className="text-[#9194a2] text-xs bg-white/10 px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>
                <span className={`font-mono font-bold text-sm ${(item.type || "").toLowerCase().includes("support") ? "text-[#ed5750]" : "text-[#42C0A5]"}`}>
                  {Number.isFinite(item.price) ? Number(item.price).toLocaleString() : "--"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {isLoading ? (
              <div className="text-[#9194a2] text-sm text-center py-4">
                Scanning active markets...
              </div>
            ) : (
              indicatorSignals.length === 0 ? (
                <div className="text-[#9194a2] text-sm text-center py-4">{hasSignalsError ? "Unable to load indicator signals." : "No indicator signals from backend."}</div>
              ) : (
              <>
              {indicatorSignals.map((item, index) => (
                <div
                  key={`${item.symbol}-${index}`}
                  className="flex justify-between items-center p-2.5 rounded hover:bg-white/10/50 text-xs border-b border-white/10/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#e2e8f0] text-sm w-24">
                      {item.symbol}
                    </span>
                    <span className="text-[#9194a2] text-xs bg-white/10 px-2 py-0.5 rounded">
                      {item.value}
                    </span>
                  </div>
                  <span className="text-[#42C0A5] font-mono font-bold text-xs text-right">
                    {(item.stocks || []).length ? (item.stocks || []).join(", ") : "--"}
                  </span>
                </div>
              ))}
              </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FODashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFno = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const response = await fetchFnoDashboard();
        if (isMounted) {
          setDashboard(response);
        }
      } catch (error) {
        console.error("Failed to load F&O dashboard:", error);
        if (isMounted) {
          setDashboard(null);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadFno(false);
    const intervalId = setInterval(() => {
      loadFno(true);
    }, 45000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const activeContracts = Array.isArray(dashboard?.activeContracts) ? dashboard.activeContracts : [];
  const fallbackContracts = [
    { symbol: "NIFTY 50 22500 CE", type: "CALL", oi: "42.3L" },
    { symbol: "NIFTY 50 22400 PE", type: "PUT", oi: "38.1L" },
  ];
  const contracts = activeContracts.length ? activeContracts : fallbackContracts;
  const pcr = Number(dashboard?.pcr?.nifty);
  const callOi = contracts
    .filter((contract) => String(contract.type).toLowerCase().includes("call"))
    .map((contract) => contract.oi)
    .join(" · ") || "--";
  const putOi = contracts
    .filter((contract) => String(contract.type).toLowerCase().includes("put"))
    .map((contract) => contract.oi)
    .join(" · ") || "--";
  const longCount = dashboard?.buildup?.long?.length || 0;
  const shortCount = dashboard?.buildup?.short?.length || 0;
  const normalizedPcr = Number.isFinite(pcr) ? Math.max(0, Math.min(100, Math.round(pcr * 50))) : 0;

  return (
  <div className="trader-card flex flex-col h-full bg-transparent border border-white/10 relative">
    {isLoading && (
      <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[10px] font-mono text-[#9194a2] uppercase tracking-wider">Loading derivatives...</div>
    )}
    <div className="card-header flex justify-between items-center mb-2 px-2.5 py-1 bg-white/5 border-b border-white/10">
      <h3 className="text-[#9194a2] font-bold text-xs tracking-wider">
        F&O INSIGHTS
      </h3>
      <div className="flex gap-2 items-center">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-[10px] text-[#42C0A5] uppercase">
          Options Chain
        </span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 h-full p-2">
      <div className="flex flex-col justify-center border-r border-white/10 pr-2.5">
        <div className="flex justify-between text-xs text-[#9194a2] mb-1">
          <span>PCR (Nifty)</span>
          <span className="text-white font-bold font-mono">{Number.isFinite(pcr) ? pcr.toFixed(2) : "--"}</span>
        </div>
        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10 mb-4">
          <div className="bg-gradient-to-r from-[#ed5750] via-yellow-400 to-[#42C0A5] w-full h-full relative">
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_5px_white]"
              style={{ left: `${normalizedPcr}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-[#5d606b] mb-4 px-1">
          <div className="text-center">
            <div className="font-bold text-[#ed5750] text-sm">{callOi}</div>
            <div>CALL OI</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-[#42C0A5] text-sm">{putOi}</div>
            <div>PUT OI</div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-[#9194a2] mb-1">
          <span>MAX PAIN</span>
          <span className="text-[#e2e8f0] font-bold font-mono">{contracts[0]?.symbol?.split(" ")?.[1] || "--"}</span>
        </div>
        <div className="flex justify-between text-xs text-[#9194a2]">
          <span>IV PERCENTILE</span>
          <span className="text-[#e2e8f0] font-bold font-mono">{Number.isFinite(pcr) ? `${Math.min(99, Math.round(pcr * 45))}%` : "--"}</span>
        </div>
      </div>

      <div className="space-y-2 text-xs flex flex-col justify-center">
        <div className="flex justify-between items-center bg-white/10/30 p-2.5 rounded border-l-2 border-[#42C0A5]">
          <div>
            <div className="text-[#e2e8f0] font-bold text-sm">
              Long Buildup
            </div>
            <div className="text-xs text-[#5d606b] mt-1">{dashboard?.buildup?.long?.join(", ") || "Fallback basket"}</div>
          </div>
          <span className="font-mono text-white bg-[#42C0A5]/20 px-2 py-1 rounded text-sm">
            {longCount}
          </span>
        </div>
        <div className="flex justify-between items-center bg-white/10/30 p-2.5 rounded border-l-2 border-[#ed5750]">
          <div>
            <div className="text-[#e2e8f0] font-bold text-sm">
              Short Covering
            </div>
            <div className="text-xs text-[#5d606b] mt-1">{dashboard?.buildup?.short?.join(", ") || "Fallback basket"}</div>
          </div>
          <span className="font-mono text-white bg-[#ed5750]/20 px-2 py-1 rounded text-sm">
            {shortCount}
          </span>
        </div>
      </div>
    </div>
  </div>
  );
};

const MarketBreadth = () => {
  const [breadth, setBreadth] = useState({ adv: 1240, unch: 230, dec: 980 });

  useEffect(() => {
    let isMounted = true;

    const loadBreadth = async () => {
      try {
        const response = await fetchHeatmap();
        const changes = (response || []).map((sector) => {
          const sectorChanges = sector.children?.map((item) => Number(item.change) || 0) || [];
          return sectorChanges.length ? sectorChanges.reduce((sum, value) => sum + value, 0) / sectorChanges.length : 0;
        });

        const adv = changes.filter((value) => value > 0).length;
        const dec = changes.filter((value) => value < 0).length;
        const unch = changes.filter((value) => value === 0).length;

        if (changes.length > 0) {
          const scale = 180;
          if (isMounted) {
            setBreadth({
              adv: adv * scale,
              unch: Math.max(unch * scale, 90),
              dec: dec * scale,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load market breadth:", error);
      }
    };

    loadBreadth();

    const intervalId = setInterval(() => {
      loadBreadth();
    }, 45000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const total = breadth.adv + breadth.unch + breadth.dec || 1;

  return (
  <div className="trader-card h-full bg-transparent border border-white/10 flex flex-col gap-2.5 rounded-lg p-2.5">
    <div className="flex justify-between text-xs text-[#9194a2] font-bold tracking-wider">
      <span>MARKET BREADTH</span>
    </div>
    <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-black/40">
      <div
        className="bg-[#42C0A5] h-full shadow-[0_0_5px_#42C0A5]"
        style={{ width: `${(breadth.adv / total) * 100}%` }}
      ></div>
      <div className="bg-[#5d606b] h-full" style={{ width: `${(breadth.unch / total) * 100}%` }}></div>
      <div
        className="bg-[#ed5750] h-full shadow-[0_0_5px_#ed5750]"
        style={{ width: `${(breadth.dec / total) * 100}%` }}
      ></div>
    </div>
    <div className="flex justify-between text-xs font-mono font-bold">
      <div className="text-[#42C0A5]">
        {breadth.adv} <span className="text-[10px] opacity-70">ADV</span>
      </div>
      <div className="text-[#9194a2]">
        {breadth.unch} <span className="text-[10px] opacity-70">UNCH</span>
      </div>
      <div className="text-[#ed5750]">
        {breadth.dec} <span className="text-[10px] opacity-70">DEC</span>
      </div>
    </div>
  </div>
  );
};

const MarketSentiment = () => {
  const [sentiment, setSentiment] = useState(68);

  useEffect(() => {
    let isMounted = true;

    const loadSentiment = async () => {
      try {
        const [pulseResponse, heatmapResponse] = await Promise.allSettled([
          fetchPulse(),
          fetchHeatmap(),
        ]);

        const pulse = pulseResponse.status === "fulfilled" ? pulseResponse.value : FALLBACK_PULSE;
        const heatmap = heatmapResponse.status === "fulfilled" ? heatmapResponse.value : [];

        const gapUp = pulse?.gapUp?.length || 0;
        const gapDown = pulse?.gapDown?.length || 0;
        const sectorBoost = (heatmap || []).reduce((sum, sector) => {
          const avg = (sector.children || []).reduce((acc, item) => acc + (Number(item.change) || 0), 0) / Math.max((sector.children || []).length, 1);
          return sum + avg;
        }, 0);

        const base = gapUp + gapDown > 0 ? (gapUp / (gapUp + gapDown)) * 100 : 50;
        const adjusted = Math.max(5, Math.min(95, Math.round(base + sectorBoost * 5)));
        if (isMounted) {
          setSentiment(adjusted);
        }
      } catch (error) {
        console.error("Failed to load market sentiment:", error);
      }
    };

    loadSentiment();

    const intervalId = setInterval(() => {
      loadSentiment();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
  <div className="trader-card h-full bg-transparent border border-white/10 flex flex-col gap-2.5 rounded-lg p-2.5">
    <div className="flex justify-between text-xs text-[#9194a2] font-bold tracking-wider">
      <span>MARKET SENTIMENT</span>
    </div>
    <div className="relative h-3 bg-black/40 rounded-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ed5750] via-yellow-500 to-[#42C0A5]"></div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white]"
        style={{ left: `${sentiment}%` }}
      ></div>
    </div>
    <div className="flex justify-between text-xs font-mono font-bold">
      <span className="text-[#ed5750]">BEARISH</span>
      <span className="text-[#42C0A5]">BULLISH {sentiment}%</span>
    </div>
  </div>
  );
};

const NewsFlash = () => {
  const [newsItems, setNewsItems] = useState([
    { source: "RADAR", title: "Fallback market headline stream active while backend syncs.", publishedAt: new Date().toISOString() },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadNews = async (silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const response = await fetchMarketNews();
        if (isMounted) {
          setNewsItems(
            Array.isArray(response) && response.length
              ? response
              : [{ source: "RADAR", title: "Fallback market headline stream active while backend syncs.", publishedAt: new Date().toISOString() }]
          );
        }
      } catch (error) {
        console.error("Failed to load market news:", error);
        if (isMounted) {
          setNewsItems([{ source: "RADAR", title: "Fallback market headline stream active while backend syncs.", publishedAt: new Date().toISOString() }]);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    loadNews(false);
    const intervalId = setInterval(() => {
      loadNews(true);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const items = newsItems;

  return (
  <div className="trader-card flex flex-col h-full bg-transparent border border-white/10 rounded-lg overflow-hidden relative">
    {isLoading && (
      <div className="absolute inset-0 bg-[#0b0f17]/70 backdrop-blur-sm z-20 flex items-center justify-center text-[10px] font-mono text-[#9194a2] uppercase tracking-wider">Loading headlines...</div>
    )}
    <div className="card-header flex justify-between items-center mb-1.5 px-2.5 py-1.5 bg-white/5 border-b border-white/10">
      <h3 className="text-[#9194a2] font-bold text-xs tracking-wider flex items-center gap-2">
        <Activity size={12} className="text-[#ed5750]" />
        NEWS FLASH
      </h3>
    </div>
    <div className="flex-1 relative overflow-hidden p-1">
      <div className="overflow-y-auto custom-scrollbar space-y-2 h-full pr-1">
        {!isLoading && items.length === 0 && (
          <div className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider text-center py-3">No backend headlines.</div>
        )}
        {items.map((news, i) => (
          <div
            key={i}
            className="flex gap-2 text-xs border-b border-white/10/30 pb-2 hover:bg-white/10/30 p-1.5 rounded cursor-pointer group transition-colors"
          >
            <span className="text-[#5d606b] font-mono whitespace-nowrap">
              {formatNewsTime(news.publishedAt)}
            </span>
            <div>
              <span
                className={`font-bold mr-2 ${(news.source || "").toLowerCase().includes("fed") ? "text-[#ed5750]" : "text-[#42C0A5]"
                  }`}
              >
                {news.source}
              </span>
              <span className="text-[#9194a2] group-hover:text-[#e2e8f0] font-medium leading-relaxed">
                {news.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};


const QuickTradePanel = () => {
  const { activeSymbol, activeType, setAsset } = useAsset();
  const [qty, setQty] = useState("50");
  const [price, setPrice] = useState("18500");
  const [orderType, setOrderType] = useState("MARKET");
  const [tradeSymbol, setTradeSymbol] = useState(activeSymbol || "AAPL");
  const [lastAction, setLastAction] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [depth, setDepth] = useState(null);
  const [tradeError, setTradeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tradeAssetType = toTradeAssetType(activeType);

  useEffect(() => {
    if (activeSymbol && activeSymbol !== tradeSymbol) {
      setTradeSymbol(activeSymbol);
    }
  }, [activeSymbol, tradeSymbol]);

  useEffect(() => {
    let isMounted = true;

    const loadTradeContext = async () => {
      try {
        const [portfolioResponse, depthResponse] = await Promise.allSettled([
          fetchPortfolio(),
          fetchQuickOrderData(tradeSymbol),
        ]);

        if (!isMounted) {
          return;
        }

        if (portfolioResponse.status === "fulfilled") {
          setPortfolio(portfolioResponse.value);
        }

        if (depthResponse.status === "fulfilled") {
          setDepth(depthResponse.value);
          if (orderType === "MARKET") {
            const bestAsk = Number(depthResponse.value?.asks?.[0]?.price || 0);
            const bestBid = Number(depthResponse.value?.bids?.[0]?.price || 0);
            setPrice((currentPrice) => {
              const midpoint = bestAsk && bestBid
                ? ((bestAsk + bestBid) / 2).toFixed(2)
                : bestAsk || bestBid || currentPrice;
              return String(midpoint);
            });
          }
        }
      } catch (error) {
        console.error("Failed to load trade context:", error);
      }
    };

    loadTradeContext();

    const intervalId = setInterval(() => {
      loadTradeContext();
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [tradeSymbol, orderType]);

  const handleTrade = async (side) => {
    try {
      setIsSubmitting(true);
      setTradeError("");

      const executionPrice = Number(price || depth?.asks?.[0]?.price || depth?.bids?.[0]?.price || 0);
      const updatedPortfolio = await executeTrade({
        symbol: tradeSymbol,
        action: side,
        quantity: Number(qty),
        price: executionPrice,
        assetType: tradeAssetType,
      });

      setPortfolio(updatedPortfolio);
      setLastAction({ side, qty, price: orderType === "MARKET" ? executionPrice.toFixed(2) : price, time: new Date().toLocaleTimeString() });
      setTimeout(() => setLastAction(null), 3000);
    } catch (error) {
      console.error("Trade execution failed:", error);
      setTradeError(error?.response?.data?.error || "Trade failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableMargin = Number(portfolio?.cashBalance || 0);
  const marginRequired = Math.round((Number(qty || 0) || 0) * (Number(price || 0) || 0));
  const holdings = portfolio?.holdings || [];
  const currentHolding = holdings.find((holding) => holding.symbol === String(tradeSymbol).toUpperCase());
  const bestBid = depth?.bids?.[0];
  const bestAsk = depth?.asks?.[0];

  return (
    <div className="trader-card flex flex-col h-full bg-gradient-to-br from-[#131722] to-[#0d1117] border border-white/10">
      <div className="card-header flex justify-between items-center px-2.5 py-1.5 bg-gradient-to-r from-[#1a1e2e] to-[#131722] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#42C0A5] rounded-full animate-pulse"></div>
          <h3 className="text-[#9194a2] font-bold text-xs tracking-wider">QUICK TRADE</h3>
        </div>
        <select
          value={tradeSymbol}
          onChange={(e) => {
            setTradeSymbol(e.target.value);
            setAsset(e.target.value, activeType);
          }}
          className="text-[10px] bg-white/5 border border-white/10 text-[#d1d4dc] rounded px-1.5 py-1 outline-none cursor-pointer"
        >
          {[tradeSymbol, "AAPL", "NVDA", "MSFT", "TSLA", "AMZN"].filter((value, index, array) => array.indexOf(value) === index).map(s => (
            <option key={s} value={s} className="bg-[#131722]">{s}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 p-2 space-y-2">
        {}
        <div className="flex gap-1">
          {["MARKET", "LIMIT", "SL"].map(t => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${orderType === t
                ? "bg-[#42C0A5] text-white border border-[#42C0A5]"
                : "bg-white/5 text-[#9194a2] border border-white/10 hover:border-[#42C0A5]/50"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {}
        <div>
          <div className="text-[10px] text-[#5d606b] uppercase tracking-wider mb-1.5">Quantity (Lots)</div>
          <div className="flex gap-1">
            {["25", "50", "75", "MAX"].map(q => (
              <button
                key={q}
                onClick={() => setQty(q === "MAX" ? "200" : q)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${qty === (q === "MAX" ? "200" : q)
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-white/5 text-[#9194a2] border border-white/10 hover:border-white/20"
                  }`}
              >
                {q}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="mt-1.5 w-full bg-white/5 border border-white/10 text-[#d1d4dc] text-xs rounded px-2 py-1.5 outline-none focus:border-[#42C0A5]/50 font-mono"
            placeholder="Custom qty..."
          />
        </div>

        {}
        {orderType !== "MARKET" && (
          <div>
            <div className="text-[10px] text-[#5d606b] uppercase tracking-wider mb-1.5">Price</div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-[#d1d4dc] text-xs rounded px-2 py-1.5 outline-none focus:border-[#42C0A5]/50 font-mono"
              placeholder="Enter price..."
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <div className="text-[#5d606b] uppercase tracking-wider mb-1">Best Bid</div>
            <div className="text-[#42C0A5] font-mono font-bold">{bestBid ? `${bestBid.price} Ã— ${bestBid.size}` : "--"}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <div className="text-[#5d606b] uppercase tracking-wider mb-1">Best Ask</div>
            <div className="text-[#ed5750] font-mono font-bold">{bestAsk ? `${bestAsk.price} Ã— ${bestAsk.size}` : "--"}</div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTrade("BUY")}
            disabled={isSubmitting}
            className="py-3 text-sm font-bold rounded-lg bg-gradient-to-b from-[#42C0A5] to-[#2d9a5a] text-white border border-[#42C0A5]/50 hover:from-[#4dc87a] hover:to-[#42C0A5] transition-all shadow-[0_4px_12px_rgba(61,178,107,0.3)] hover:shadow-[0_6px_20px_rgba(61,178,107,0.4)] active:scale-95"
          >
            {isSubmitting ? "WORKING..." : "BUY"}
          </button>
          <button
            onClick={() => handleTrade("SELL")}
            disabled={isSubmitting}
            className="py-3 text-sm font-bold rounded-lg bg-gradient-to-b from-[#ed5750] to-[#c94040] text-white border border-[#ed5750]/50 hover:from-[#f06860] hover:to-[#ed5750] transition-all shadow-[0_4px_12px_rgba(237,87,80,0.3)] hover:shadow-[0_6px_20px_rgba(237,87,80,0.4)] active:scale-95"
          >
            {isSubmitting ? "WORKING..." : "SELL"}
          </button>
        </div>

        {}
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
          <div className="flex justify-between text-[10px] text-[#5d606b] mb-1">
            <span>Margin Required</span>
            <span className="text-[#d1d4dc] font-mono">₹{marginRequired.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-[#5d606b]">
            <span>Available Margin</span>
            <span className="text-[#42C0A5] font-mono">₹{availableMargin.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-[#5d606b] mt-1">
            <span>Current Holding</span>
            <span className="text-[#d1d4dc] font-mono">{currentHolding ? `${currentHolding.quantity} @ ${Number(currentHolding.avgBuyPrice || 0).toFixed(2)}` : "None"}</span>
          </div>
        </div>

        {tradeError && (
          <div className="text-center text-[11px] font-bold py-2 rounded-lg bg-[#ed5750]/20 text-[#ed5750] border border-[#ed5750]/30">
            {tradeError}
          </div>
        )}

        {}
        {lastAction && (
          <div className={`text-center text-[11px] font-bold py-2 rounded-lg animate-pulse ${lastAction.side === "BUY"
            ? "bg-[#42C0A5]/20 text-[#42C0A5] border border-[#42C0A5]/30"
            : "bg-[#ed5750]/20 text-[#ed5750] border border-[#ed5750]/30"
            }`}>
            ✓ {lastAction.side} {lastAction.qty} @ {lastAction.price} — {lastAction.time}
          </div>
        )}
      </div>
    </div>
  );
};

function TraderView({ activeModule }) {
  const [expandedChart, setExpandedChart] = useState(null);
  const [timeframe, setTimeframe] = useState("15m");
  const [showIndicators, setShowIndicators] = useState(false);
  const [layout, setLayout] = useState("4-grid");
  const [expandedChartData, setExpandedChartData] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadExpandedChart = async () => {
      if (!expandedChart) {
        if (isMounted) {
          setExpandedChartData([]);
        }
        return;
      }

      try {
        const backendSymbol = resolveBackendSymbol(expandedChart);
        const backendInterval = BACKEND_INTERVAL_MAP[timeframe] || "1D";
        const response = await fetchMarketHistory(backendSymbol, "STOCK", backendInterval);
        const points = Array.isArray(response?.data) ? response.data : [];
        if (isMounted) {
          setExpandedChartData(
            points
              .map((point) => ({
                time: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                price: Number(point.close || 0),
              }))
              .filter((point) => Number.isFinite(point.price) && point.price > 0)
          );
        }
      } catch (error) {
        console.error("Failed to load expanded chart history:", error);
        if (isMounted) {
          setExpandedChartData([]);
        }
      }
    };

    loadExpandedChart();

    return () => {
      isMounted = false;
    };
  }, [expandedChart, timeframe]);

  if (activeModule === "WATCHLIST") {
    return (
      <div className="dashboard-layout flex flex-col w-full">
        <div className="flex-1 overflow-y-auto main-content-area">
          <div className="max-w-[1920px] mx-auto px-1.5 pt-1.5 pb-3 grid grid-cols-1 xl:grid-cols-12 gap-1.5 h-[calc(100vh-80px)]">
            <section className="bento-card xl:col-span-12 p-1.5 h-full" style={{ animationDelay: '0.1s' }}>
              <SharedAdvancedWatchlist />
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (activeModule === "SCREENERS") {
    return (
      <div className="dashboard-layout flex flex-col w-full">
        <div className="flex-1 overflow-y-auto main-content-area">
          <div className="max-w-[1920px] mx-auto px-1.5 pt-1.5 pb-3 grid grid-cols-1 xl:grid-cols-12 gap-1.5 h-[calc(100vh-80px)]">
            <section className="bento-card xl:col-span-12 p-1.5 h-full" style={{ animationDelay: '0.1s' }}>
              <AdvancedScreener />
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (activeModule === "NEWS") {
    return (
      <div className="dashboard-layout flex flex-col w-full">
        <div className="flex-1 overflow-y-auto main-content-area">
          <div className="max-w-[1920px] mx-auto px-1.5 pt-1.5 pb-3 grid grid-cols-1 xl:grid-cols-12 gap-1.5 h-[calc(100vh-80px)]">
            <section className="bento-card xl:col-span-12 p-1.5 h-full" style={{ animationDelay: '0.1s' }}>
              <NewsFlash />
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout flex flex-col w-full">
      <div className="flex-1 overflow-y-auto main-content-area">
        <div className="trader-bento-grid max-w-[1920px] mx-auto px-1.5 pt-1.5 pb-3">

          {}
          <section className="bento-card bento-workspace" style={{ animationDelay: '0.1s' }}>
            <div className="workspace-header">
              <div className="workspace-title">
                <span className="workspace-label">Multi-Chart Workspace</span>
                <span className="workspace-symbol">
                  NIFTY 50 <span className="text-[#42C0A5]">18,500 +0.52%</span>
                </span>
              </div>
              <div className="workspace-controls">
                {["1m", "5m", "15m", "1h", "4h", "1D"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`workspace-chip ${tf === timeframe ? "active" : ""}`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  className={`workspace-chip ${showIndicators ? "active" : ""}`}
                >
                  Indicators
                </button>
                <button
                  onClick={() => {
                    const layouts = ["1-grid", "2-grid", "4-grid"];
                    const currentIndex = layouts.indexOf(layout);
                    const nextIndex = (currentIndex + 1) % layouts.length;
                    setLayout(layouts[nextIndex]);
                  }}
                  className="workspace-chip"
                >
                  Layouts
                </button>
              </div>
            </div>
            <SharedMultiChartGrid
              className="workspace-body"
              onOpenChart={(title) => setExpandedChart(title)}
              timeframe={timeframe}
              showIndicators={showIndicators}
              layout={layout}
            />
          </section>

          {}
          <aside className="bento-card bento-watchlist" style={{ animationDelay: '0.15s' }}>
            <SharedAdvancedWatchlist />
          </aside>

          {}
          <section className="bento-card bento-positions" style={{ animationDelay: '0.2s' }}>
            <SignalEnginePanel />
          </section>

          {}
          <aside className="bento-card bento-orderbook" style={{ animationDelay: '0.25s' }}>
            <TrendStrengthPanel />
          </aside>

          {}
          <aside className="bento-card bento-alerts" style={{ animationDelay: '0.3s' }}>
            <CatalystPanel />
          </aside>

          {}
          <aside className="bento-card bento-trade" style={{ animationDelay: '0.35s' }}>
            <InstrumentSummaryPanel />
          </aside>

          {}
          <section className="bento-card bento-wide" style={{ animationDelay: '0.4s' }}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 h-full p-1.5">
              <SectorHeatmap />
              <GapLists />
            </div>
          </section>

          {}
          <aside className="bento-card bento-side" style={{ animationDelay: '0.45s' }}>
            <div className="h-full p-1.5">
              <VolumeShockers />
            </div>
          </aside>

          {}
          <section className="bento-card bento-wide" style={{ animationDelay: '0.5s' }}>
            <div className="h-full p-1.5">
              <TechnicalScreeners />
            </div>
          </section>

          {}
          <aside className="bento-card bento-side" style={{ animationDelay: '0.55s' }}>
            <div className="h-full p-1.5">
              <NewsFlash />
            </div>
          </aside>

          {}
          <section className="bento-card bento-full" style={{ animationDelay: '0.6s' }}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 h-full p-1.5">
              <FODashboard />
              <KeyLevelsPanel />
            </div>
          </section>

        </div>
      </div>


      {expandedChart && (
        <div className="chart-modal" role="dialog" aria-modal="true">
          <div
            className="chart-modal-backdrop"
            onClick={() => setExpandedChart(null)}
          ></div>
          <div className="chart-modal-panel">
            <div className="chart-modal-header">
              <div className="chart-modal-title">
                {expandedChart} — Full Screen
              </div>
              <button
                className="chart-modal-close"
                onClick={() => setExpandedChart(null)}
              >
                ✕ Close
              </button>
            </div>
            <div className="chart-modal-body">
              {expandedChartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-[#9194a2] font-mono uppercase tracking-wider">
                  No backend chart data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={expandedChartData}>
                  <defs>
                    <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#42C0A5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#42C0A5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f141f",
                      border: "1px solid #2a2e39",
                      fontSize: "12px",
                      color: "#d1d4dc",
                    }}
                    itemStyle={{ color: "#d1d4dc" }}
                    labelStyle={{ color: "#8b909a" }}
                  />
                  <XAxis dataKey="time" stroke="#2a2e39" tick={{ fill: "#8b909a", fontSize: 11 }} />
                  <YAxis stroke="#2a2e39" tick={{ fill: "#8b909a", fontSize: 11 }} domain={["auto", "auto"]} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#42C0A5"
                    fill="url(#modalGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <CartesianGrid stroke="#1f2633" strokeDasharray="3 3" vertical={false} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default TraderView;
