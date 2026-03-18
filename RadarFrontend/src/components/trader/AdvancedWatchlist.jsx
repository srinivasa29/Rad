import { useState, useEffect } from "react";
import { useAsset } from "../../context/AssetContext";
import { fetchWatchlistTechnicals } from "../../api/technicalApi";
import { priceData } from "../../pages/dashboardData";
import { Search } from "lucide-react";

const AdvancedWatchlist = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setAsset } = useAsset();

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const rows = await fetchWatchlistTechnicals();
        const normalized = (Array.isArray(rows) ? rows : []).map((item) => {
          const rawChange = Number(item.changePercent ?? item.change_24h ?? item.change ?? 0);
          const changePercent = `${rawChange >= 0 ? '+' : ''}${rawChange.toFixed(2)}`;
          const volumeRaw = String(item?.details?.volume || '');
          const volume = Number.parseInt(volumeRaw.replace(/[^\d]/g, ''), 10) || 50;

          return {
            symbol: item.symbol,
            price: Number(item.price || 0),
            changePercent,
            volume,
            history: Array.isArray(item?.technicals?.sparkline)
              ? item.technicals.sparkline.map((value) => Number(value)).filter((value) => Number.isFinite(value))
              : [],
            technicalScore: Math.max(5, Math.min(95, Math.round(50 + rawChange * 8))),
          };
        });

        setData(normalized);
      } catch (err) {
        console.error(err);
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
          <div className="text-[10px] text-[#42C0A5] bg-[#42C0A5]/10 px-2.5 flex items-center gap-1 py-1 rounded-full border border-[#42C0A5]/20 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#42C0A5] rounded-full animate-pulse"></span>
            Live
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
              const chgText = String(row.changePercent || "0");
              const isPos = !chgText.startsWith("-");
              const safeChg = chgText.replace('+', '').replace('%', '');

              const outlookText = row.technicalScore > 75 ? "Breakout" : (row.technicalScore < 35 ? "Sell" : "Watch");
              const outColor = row.technicalScore > 75 ? "#3db26b" : (row.technicalScore < 35 ? "#ed5750" : "#f0b429");
              const volPct = Math.min(100, Math.max(10, parseInt(row.volume) || 50));

              return (
                <tr
                  key={i}
                  className="bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                  onClick={() => setAsset(row.symbol)}
                >
                  <td className="py-2.5 pl-3 rounded-l-xl font-bold text-white tracking-wide border-y border-l border-white/5 group-hover:border-white/10">
                    {row.symbol}
                  </td>
                  <td className="py-2.5 border-y border-white/5 group-hover:border-white/10">
                    <div className="flex justify-center">
                      <svg width="52" height="22" viewBox="0 0 52 22">
                        {(() => {
                          const pts = (row.history && row.history.length > 2) ? row.history : priceData.map(p => p.price);
                          const vals = pts.slice(0, 12);
                          const min = Math.min(...vals);
                          const max = Math.max(...vals);
                          const range = max - min || 1;
                          const points = vals.map((v, idx) =>
                            `${(idx / (vals.length - 1)) * 50 + 1},${20 - ((v - min) / range) * 18 + 1}`
                          ).join(" ");
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
                              <circle cx={points.split(" ").pop().split(",")[0]} cy={points.split(" ").pop().split(",")[1]} r="2" fill={color} />
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-white font-mono font-medium pr-1 border-y border-white/5 group-hover:border-white/10">
                    {(row.price || 0).toLocaleString()}
                  </td>
                  <td className={`py-2.5 text-right font-mono font-bold border-y border-white/5 group-hover:border-white/10 ${isPos ? "text-[#42C0A5]" : "text-red-400"}`}>
                    {isPos ? '+' : ''}{safeChg}%
                  </td>
                  <td className="py-2.5 px-2 border-y border-white/5 group-hover:border-white/10">
                    <div className="w-full h-1.5 bg-white/5 rounded overflow-hidden">
                      <div
                        style={{ width: `${volPct}%`, background: isPos ? "#42C0A5" : "#f87171", opacity: 0.8 }}
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
            {!isLoading && data.length === 0 && (
              <tr><td colSpan="6" className="text-center py-4 text-[#5d606b]">No watchlist data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancedWatchlist;
