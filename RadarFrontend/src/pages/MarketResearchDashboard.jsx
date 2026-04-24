import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp } from "lucide-react";
import SectionPanel from "../components/research/SectionPanel";
import ScanLoader from "../components/research/ScanLoader";
import EmptyState from "../components/research/EmptyState";
import ScreenerCard from "../components/research/ScreenerCard";
import SectorFilter from "../components/research/SectorFilter";
import ScannerControls from "../components/research/ScannerControls";
import SearchBar from "../components/research/SearchBar";
import ActionPanel from "../components/research/ActionPanel";
import { researchMockData } from "../data/researchMockData";

const TABS = ["Market Opportunities", "Momentum", "Breakout", "Pullback", "Fakeout"];
const SECTORS = ["All", "IT", "Banking", "Auto", "Pharma", "FMCG", "Energy"];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const mapTabToSignal = (tab) => {
  if (tab === "Market Opportunities") return "all";
  return tab;
};

const applyFilters = ({ stocks, filters, activeTab, searchText }) => {
  const query = searchText.trim().toLowerCase();
  const selectedSignal = mapTabToSignal(activeTab);

  return stocks.filter((stock) => {
    if (query && !`${stock.name} ${stock.sector}`.toLowerCase().includes(query)) return false;
    if (filters.sector !== "All" && stock.sector !== filters.sector) return false;
    if (stock.rsi < filters.rsi[0] || stock.rsi > filters.rsi[1]) return false;
    if (filters.volumeSpike && !stock.volumeSpike) return false;
    if (filters.breakout && !stock.breakoutCandidate) return false;
    if (filters.aboveSma50 && !stock.aboveSma50) return false;
    if (filters.macdPositive && !stock.macdPositive) return false;
    if (selectedSignal !== "all" && stock.signalType !== selectedSignal) return false;
    return true;
  });
};

const mutateStockForScan = (stock) => {
  const nextChange = Number((stock.change + (Math.random() * 1.2 - 0.6)).toFixed(2));
  const nextPrice = Number((stock.price * (1 + nextChange / 1000)).toFixed(2));
  const nextRsi = Math.max(20, Math.min(85, stock.rsi + randomBetween(-4, 4)));
  const nextVolume = Math.max(1000000, Math.round(stock.volume * (0.9 + Math.random() * 0.35)));

  return {
    ...stock,
    price: nextPrice,
    change: nextChange,
    rsi: nextRsi,
    volume: nextVolume,
    volumeSpike: nextVolume > stock.volume * 1.08 ? true : stock.volumeSpike,
  };
};

const MarketResearchDashboard = () => {
  const [baseStocks, setBaseStocks] = useState(researchMockData.stocks);
  const [filteredStocks, setFilteredStocks] = useState(researchMockData.stocks);
  const [expandedStockId, setExpandedStockId] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("Market Opportunities");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);

  const [marketPulse, setMarketPulse] = useState({
    nifty: researchMockData.niftyValue,
    sentimentLabel: researchMockData.sentiment.label,
    sentimentScore: researchMockData.sentiment.score,
  });

  const [filters, setFilters] = useState({
    sector: "All",
    rsi: [30, 70],
    volumeSpike: false,
    breakout: false,
    aboveSma50: false,
    macdPositive: false,
  });

  const sectors = useMemo(() => {
    const dynamic = Array.from(new Set(baseStocks.map((stock) => stock.sector)));
    const all = new Set([...SECTORS, ...dynamic]);
    return Array.from(all);
  }, [baseStocks]);

  useEffect(() => {
    const next = applyFilters({
      stocks: baseStocks,
      filters,
      activeTab,
      searchText: search,
    });
    setFilteredStocks(next);
  }, [baseStocks, filters, activeTab, search]);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setMarketPulse((prev) => {
        const nextNifty = Number((prev.nifty + (Math.random() * 18 - 9)).toFixed(2));
        const nextScore = Math.max(35, Math.min(85, prev.sentimentScore + randomBetween(-2, 2)));
        const nextLabel = nextScore >= 65 ? "Constructive" : nextScore <= 45 ? "Cautious" : "Neutral";

        return {
          nifty: nextNifty,
          sentimentScore: nextScore,
          sentimentLabel: nextLabel,
        };
      });

      setBaseStocks((prev) => prev.map((stock) => {
        const drift = Math.random() * 0.5 - 0.25;
        return {
          ...stock,
          price: Number((stock.price * (1 + drift / 100)).toFixed(2)),
        };
      }));
    }, 4500);

    return () => clearInterval(pulseInterval);
  }, []);

  const runScan = () => {
    setIsScanning(true);
    setNotice(null);

    const wait = randomBetween(1000, 2000);
    setTimeout(() => {
      setBaseStocks((prev) => {
        const updated = prev.map(mutateStockForScan);
        return [...updated].sort((a, b) => b.rsi - a.rsi);
      });
      setIsScanning(false);
      setNotice("Scan complete. Signals refreshed.");
    }, wait);
  };

  const clearFilters = () => {
    setFilters({
      sector: "All",
      rsi: [30, 70],
      volumeSpike: false,
      breakout: false,
      aboveSma50: false,
      macdPositive: false,
    });
    setActiveTab("Market Opportunities");
    setSearch("");
  };

  const handleDeleteStock = (stockId) => {
    setBaseStocks((prev) => prev.filter((stock) => stock.id !== stockId));
    if (expandedStockId === stockId) {
      setExpandedStockId(null);
    }
    setNotice("Stock removed from active scanner view.");
  };

  const handleToggleBookmark = (stockId) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stockId)) {
        next.delete(stockId);
      } else {
        next.add(stockId);
      }
      return next;
    });
  };

  const simpleAction = (label) => {
    setNotice(`${label} action simulated (frontend-only).`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,#1d3358_0%,#071225_45%,#030712_100%)] text-slate-100">
      <div className="mx-auto max-w-[1760px] px-4 py-6 md:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(8,15,28,0.84),rgba(18,30,55,0.7))] p-4 backdrop-blur-md shadow-[0_14px_36px_rgba(0,0,0,0.28)] md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                <Activity size={12} />
                {researchMockData.marketStatus}
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">Market Research Screener</h1>
              <p className="mt-1 text-sm text-slate-300">Frontend-only intelligent research workspace with simulated market behavior.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                NIFTY: <span className="font-bold text-cyan-100">{marketPulse.nifty.toLocaleString("en-IN")}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                <TrendingUp size={13} className="text-cyan-200" />
                <span className="text-slate-300">Sentiment</span>
                <span className="font-bold text-cyan-100">{marketPulse.sentimentLabel}</span>
                <span className="rounded-md bg-cyan-400/15 px-2 py-0.5 font-semibold text-cyan-100">{marketPulse.sentimentScore}/100</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={setSearch} />
            <ActionPanel
              onSave={() => simpleAction("Save")}
              onExcel={() => simpleAction("Excel export")}
              onNewScan={runScan}
              isScanning={isScanning}
            />
          </div>

          {notice ? <div className="mt-3 text-xs text-cyan-100">{notice}</div> : null}
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(12,20,37,0.84),rgba(7,14,28,0.72))] p-4 backdrop-blur-md lg:sticky lg:top-4 lg:h-fit md:p-6">
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-white">Filters</h2>

            <div className="space-y-5 text-sm">
              <SectorFilter
                sectors={sectors}
                selectedSector={filters.sector}
                onSelect={(sector) => setFilters((prev) => ({ ...prev, sector }))}
              />

              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">RSI Filter</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 text-xs text-slate-300">{filters.rsi[0]} - {filters.rsi[1]}</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.rsi[0]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFilters((prev) => ({ ...prev, rsi: [Math.min(value, prev.rsi[1]), prev.rsi[1]] }));
                    }}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.rsi[1]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFilters((prev) => ({ ...prev, rsi: [prev.rsi[0], Math.max(value, prev.rsi[0])] }));
                    }}
                    className="mt-1 w-full"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Volume Spike Filter</div>
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                  Only Volume Spike
                  <input
                    type="checkbox"
                    checked={filters.volumeSpike}
                    onChange={(e) => setFilters((prev) => ({ ...prev, volumeSpike: e.target.checked }))}
                  />
                </label>
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Trend Overlays</div>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                    Above SMA 50
                    <input
                      type="checkbox"
                      checked={filters.aboveSma50}
                      onChange={(e) => setFilters((prev) => ({ ...prev, aboveSma50: e.target.checked }))}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                    MACD Positive
                    <input
                      type="checkbox"
                      checked={filters.macdPositive}
                      onChange={(e) => setFilters((prev) => ({ ...prev, macdPositive: e.target.checked }))}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                    Breakout Candidates
                    <input
                      type="checkbox"
                      checked={filters.breakout}
                      onChange={(e) => setFilters((prev) => ({ ...prev, breakout: e.target.checked }))}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={runScan}
                  disabled={isScanning}
                  className="w-full rounded-lg border border-cyan-300/35 bg-cyan-400/15 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-60"
                >
                  Activate Scan
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-white/20"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <section>
              <ScannerControls
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                resultCount={filteredStocks.length}
              />

              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 md:px-6 md:py-4">
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">Top Trade Setups</h2>
              </div>

              {isScanning ? <ScanLoader /> : null}

              {!isScanning && filteredStocks.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredStocks.map((stock) => (
                    <ScreenerCard
                      key={stock.id}
                      stock={stock}
                      expanded={expandedStockId === stock.id}
                      onToggleExpand={() => setExpandedStockId(expandedStockId === stock.id ? null : stock.id)}
                      onDelete={() => handleDeleteStock(stock.id)}
                      onToggleWatchlist={() => handleToggleBookmark(stock.id)}
                      isBookmarked={bookmarkedIds.has(stock.id)}
                    />
                  ))}
                </div>
              ) : null}

              {!isScanning && filteredStocks.length === 0 ? (
                <EmptyState onRunScan={runScan} />
              ) : null}
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
              <SectionPanel title="Market Overview" subtitle="NIFTY trend, sentiment, and volatility" accent="cyan">
                <div className="space-y-2 text-sm text-slate-200">
                  <div>NIFTY Trend: <span className="font-semibold text-emerald-200">{researchMockData.marketOverview.niftyTrend}</span></div>
                  <div>Sentiment: <span className="font-semibold text-cyan-100">{marketPulse.sentimentLabel}</span></div>
                  <div>Volatility: <span className="font-semibold text-amber-200">{researchMockData.marketOverview.volatility}</span></div>
                </div>
              </SectionPanel>

              <SectionPanel title="Sector Strength" subtitle="IT, Banking, Auto and other leadership zones" accent="emerald">
                <div className="space-y-2">
                  {researchMockData.sectorStrength.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <span>{item.name}</span>
                      <span className="text-slate-300">{item.trend} ({item.score})</span>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Pattern Scanner" subtitle="Breakouts, reversals, and consolidation behavior" accent="violet">
                <div className="space-y-2">
                  {researchMockData.patternScanner.map((item) => (
                    <div key={`${item.symbol}-${item.pattern}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                      <span className="font-semibold text-white">{item.symbol}</span> - {item.pattern} - <span className="text-slate-300">{item.status}</span>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Volume Activity" subtitle="Unusual volume and participation focus" accent="amber">
                <div className="space-y-2">
                  {researchMockData.volumeActivity.map((item) => (
                    <div key={item.symbol} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                      <span className="font-semibold text-white">{item.symbol}</span> - {item.note}
                    </div>
                  ))}
                </div>
              </SectionPanel>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
              <SectionPanel title="Watchlist Suggestions" subtitle="Stocks worth monitoring for behavior shifts" accent="cyan">
                <ul className="space-y-2 text-sm text-slate-200">
                  {researchMockData.watchlistSuggestions.map((item) => (
                    <li key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">{item}</li>
                  ))}
                </ul>
              </SectionPanel>

              <SectionPanel title="Market Insight Feed" subtitle="Streaming-style research commentary" accent="violet">
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                  {researchMockData.insightFeed.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.04, duration: 0.22 }}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>
              </SectionPanel>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MarketResearchDashboard;
