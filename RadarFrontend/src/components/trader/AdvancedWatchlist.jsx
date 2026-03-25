import { useState, useEffect } from "react";
import { useAsset } from "../../context/AssetContext";
import { fetchWatchlistTechnicals } from "../../api/technicalApi";
import { Search } from "lucide-react";

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
};

const normalizeDisplaySymbol = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (upper === "^NSEI" || upper === "NIFTY" || upper === "NIFTY50") return "NIFTY 50";
  if (upper === "^NSEBANK" || upper === "BANKNIFTY") return "BANKNIFTY";
  return upper.replace(/\.(NS|BO)$/i, "");
};

const resolveBackendSymbol = (value) => {
  const normalized = normalizeDisplaySymbol(value);
  if (!normalized) return "";
  return BACKEND_SYMBOL_MAP[normalized] || normalized;
};

const AdvancedWatchlist = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { setAsset } = useAsset();

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const rows = await fetchWatchlistTechnicals();
        const normalized = (Array.isArray(rows) ? rows : []).map((item) => {
          const rawPrice = Number(item.price ?? item.ltp ?? item.lastPrice);
          const rawChange = Number(item.changePercent ?? item.change_24h ?? item.change);
          const volumeRaw = String(item?.details?.volume || '');
          const parsedVolume = Number.parseInt(volumeRaw.replace(/[^\d]/g, ''), 10);
          const technicalScoreRaw = Number(item.technicalScore ?? item?.technicals?.score);
          const displaySymbol = normalizeDisplaySymbol(item.symbol);

          return {
            symbol: displaySymbol,
            backendSymbol: resolveBackendSymbol(item.symbol),
            price: Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : null,
            changePercent: Number.isFinite(rawChange) ? rawChange : null,
            volume: Number.isFinite(parsedVolume) && parsedVolume > 0 ? parsedVolume : null,
            history: Array.isArray(item?.technicals?.sparkline)
              ? item.technicals.sparkline.map((value) => Number(value)).filter((value) => Number.isFinite(value))
              : [],
            technicalScore: Number.isFinite(technicalScoreRaw)
              ? Math.max(0, Math.min(100, Math.round(technicalScoreRaw)))
              : null,
            outlook: String(item?.technicals?.signal || item?.outlook || '').trim() || null,
          };
        }).filter((item) => item.symbol);

        setData(normalized);
      } catch (err) {
        console.error(err);
        setHasError(true);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2.5 gap-2">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#42C0A5] rounded-full animate-pulse"></div>
            <div>
                <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans'] uppercase tracking-wider">
                  ADVANCED WATCHLIST
                </h3>
            </div>
        </div>
        <div className="flex gap-2 text-white/50 items-center">
          <div className="text-[10px] text-[#5d606b] bg-white/5 px-2.5 py-1 rounded-full border border-white/10 font-bold uppercase tracking-wider">
            {isLoading ? "Syncing" : `${data.length} Symbols`}
          </div>
          <Search size={18} className="cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>
      <div className="watchlist-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-y-1.5">
          <thead className="sticky top-0 z-10">
            <tr className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans']">
              <th className="pb-2.5 pl-3 w-[22%]">Symbol</th>
              <th className="pb-2.5 text-center w-[18%]">Trend</th>
              <th className="pb-2.5 text-right w-[18%]">LTP</th>
              <th className="pb-2.5 text-right w-[12%]">Chg%</th>
              <th className="pb-2.5 text-center w-[12%]">Vol</th>
              <th className="pb-2.5 text-center pr-3 w-[18%]">Outlook</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {data.map((row, i) => {
              const hasChange = Number.isFinite(row.changePercent);
              const isPos = hasChange ? row.changePercent >= 0 : true;
              const safeChg = hasChange ? Math.abs(row.changePercent).toFixed(2) : "--";
              const hasScore = Number.isFinite(row.technicalScore);
              const inferredOutlook = hasScore
                ? (row.technicalScore >= 75 ? "Breakout" : row.technicalScore <= 35 ? "Sell" : "Watch")
                : "--";
              const outlookText = row.outlook || inferredOutlook;
              const outColor = outlookText === "--"
                ? "#8b909a"
                : String(outlookText).toLowerCase().includes("sell") || String(outlookText).toLowerCase().includes("bear")
                  ? "#ed5750"
                  : String(outlookText).toLowerCase().includes("watch")
                    ? "#f0b429"
                    : "#3db26b";
              const hasVolume = Number.isFinite(row.volume) && row.volume > 0;
              const volPct = hasVolume ? Math.min(100, Math.max(8, Number(row.volume))) : 0;

              return (
                <tr
                  key={i}
                  className="bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                  onClick={() => setAsset(row.backendSymbol || row.symbol, "stock")}
                >
                  <td className="py-2.5 pl-3 rounded-l-xl font-bold text-white tracking-wide border-y border-l border-white/5 group-hover:border-white/10">
                    {row.symbol}
                  </td>
                  <td className="py-2.5 border-y border-white/5 group-hover:border-white/10">
                    <div className="flex justify-center">
                      {Array.isArray(row.history) && row.history.length > 2 ? (
                        <svg width="52" height="22" viewBox="0 0 52 22">
                          {(() => {
                            const vals = row.history.slice(0, 12);
                            const min = Math.min(...vals);
                            const max = Math.max(...vals);
                            const range = max - min || 1;
                            const denominator = Math.max(1, vals.length - 1);
                            const pointList = vals.map((v, idx) => (
                              `${(idx / denominator) * 50 + 1},${20 - ((v - min) / range) * 18 + 1}`
                            ));
                            const points = pointList.join(" ");
                            const lastPoint = pointList[pointList.length - 1] || "1,20";
                            const [lastX, lastY] = lastPoint.split(",");
                            const color = isPos ? "#3db26b" : "#ed5750";

                            return (
                              <>
                                <polyline
                                  points={points}
                                  fill="none"
                                  stroke={color}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle cx={lastX} cy={lastY} r="2" fill={color} />
                              </>
                            );
                          })()}
                        </svg>
                      ) : (
                        <span className="text-[10px] text-[#5d606b] font-mono uppercase tracking-wider">N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-white font-mono font-medium pr-1 border-y border-white/5 group-hover:border-white/10">
                    {Number.isFinite(row.price) ? row.price.toLocaleString() : "--"}
                  </td>
                  <td className={`py-2.5 text-right font-mono font-bold border-y border-white/5 group-hover:border-white/10 ${hasChange ? (isPos ? "text-[#42C0A5]" : "text-red-400") : "text-[#8b909a]"}`}>
                    {hasChange ? `${isPos ? '+' : '-'}${safeChg}%` : "--"}
                  </td>
                  <td className="py-2.5 px-2 border-y border-white/5 group-hover:border-white/10">
                    <div className="w-full h-1.5 bg-white/5 rounded overflow-hidden">
                      <div
                        style={{ width: `${volPct}%`, background: hasVolume ? (isPos ? "#42C0A5" : "#f87171") : "#8b909a", opacity: hasVolume ? 0.8 : 0.4 }}
                        className="h-full rounded"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-center rounded-r-xl border-y border-r border-white/5 group-hover:border-white/10">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ color: outColor, background: `${outColor}18`, border: `1px solid ${outColor}40` }}
                    >
                      {outlookText}
                    </span>
                  </td>
                </tr>
              );
            })}
            {isLoading && (
              <tr><td colSpan="6" className="text-center py-4 text-[#5d606b]">Loading watchlist...</td></tr>
            )}
            {!isLoading && hasError && data.length === 0 && (
              <tr><td colSpan="6" className="text-center py-4 text-[#f0b429]">Unable to load watchlist from backend.</td></tr>
            )}
            {!isLoading && !hasError && data.length === 0 && (
              <tr><td colSpan="6" className="text-center py-4 text-[#5d606b]">No stocks in watchlist.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancedWatchlist;
