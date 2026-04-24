import { useEffect, useMemo, useState, useRef, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  TrendingUp, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Target, 
  ShieldAlert, 
  BarChart3,
  Flame,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  LayoutPanelLeft
} from "lucide-react";
import Header from "./stockScreener/Header.jsx";
import FiltersPanel from "./stockScreener/FiltersPanel.jsx";
import StockCardGrid from "./stockScreener/StockCardGrid.jsx";
import TerminalLogs from "./stockScreener/TerminalLogs.jsx";
import StockDetailsPanel from "../watchlist/StockDetailsPanel.jsx";
import "./stockScreener/StockScreener.css";

const STORAGE_KEY = "radar_saved_screener_dashboards";
const INITIAL_ROWS = 12;

const SIGNAL_TABS = [
  { id: "all", label: "All Signals", icon: <LayoutPanelLeft className="h-4 w-4" /> },
  { id: "momentum", label: "Momentum", icon: <Zap className="h-4 w-4" /> },
  { id: "breakout", label: "Breakout", icon: <Flame className="h-4 w-4" /> },
  { id: "pullback", label: "Pullback", icon: <RefreshCw className="h-4 w-4" /> },
  { id: "fakeout", label: "Fakeout ðŸš¨", icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
];

const DEFAULT_FILTERS = {
  search: "",
  sector: "All",
  minRsi: 0,
  maxRsi: 100,
  minPrice: "",
  maxPrice: "",
  minVolume: "",
  rvol: "",
  gapMin: 0,
  sma50: false,
  sma200: false,
  macdCross: false,
};

const BASE_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", price: 2870, change: 1.8, volume: 9900000 },
  { symbol: "TCS", name: "Tata Consultancy", sector: "IT", price: 3898, change: -0.7, volume: 3100000 },
  { symbol: "INFY", name: "Infosys", sector: "IT", price: 1620, change: 1.2, volume: 8500000 },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", price: 1729, change: 0.9, volume: 7600000 },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", price: 1204, change: 1.4, volume: 9200000 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", price: 826, change: -1.1, volume: 11200000 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Financials", price: 7540, change: 2.1, volume: 1800000 },
  { symbol: "ITC", name: "ITC Limited", sector: "FMCG", price: 468, change: 0.5, volume: 8400000 },
];

const enrichTradingMetrics = (stock, index) => {
  const confidence = Math.max(30, Math.min(98, 65 + (index % 15) * 2 + (index % 7)));
  const entry = Number((stock.price * 1.002).toFixed(2));
  const target = Number((stock.price * 1.04).toFixed(2));
  const sl = Number((stock.price * 0.985).toFixed(2));
  
  const signals = ["Volume Spike", "Momentum", "Range Breakout", "EMA Pullback"];
  const signalType = signals[index % signals.length];
  
  const history = Array.from({ length: 12 }).map((_, i) => ({
    price: stock.price + (Math.random() - 0.5) * (stock.price * 0.02)
  }));

  return {
    ...stock,
    confidence,
    entry,
    target,
    sl,
    signalType,
    history,
    rvol: Number((1.2 + (index % 5) * 0.4).toFixed(2)),
    rsi: 45 + (index % 25),
    gap: Number((Math.random() * 5).toFixed(2)),
    sma50: index % 3 !== 0,
    sma200: index % 4 !== 0,
    macdCross: index % 5 === 0,
    vwap: stock.price * (0.99 + Math.random() * 0.02),
    high52w: stock.price * (1.1 + Math.random() * 0.2),
    low52w: stock.price * (0.7 + Math.random() * 0.2),
    percent: stock.change,
    changePercent: stock.change
  };
};

const MOCK_UNIVERSE = Array.from({ length: 60 }).map((_, index) => {
  const base = BASE_STOCKS[index % BASE_STOCKS.length];
  const symbol = index >= BASE_STOCKS.length ? `${base.symbol}.${index}` : base.symbol;
  return enrichTradingMetrics({ ...base, symbol }, index);
});

export default function EnhancedStockScreener({ onStockDeepAnalysis }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allStocks] = useState(MOCK_UNIVERSE);
  const [filteredStocks, setFilteredStocks] = useState(MOCK_UNIVERSE);
  const [selectedStock, setSelectedStock] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let result = allStocks.filter(stock => {
        const searchMatch = stock.symbol.toLowerCase().includes(appliedFilters.search.toLowerCase());
        const sectorMatch = appliedFilters.sector === "All" || stock.sector === appliedFilters.sector;
        
        const rvolMatch = !appliedFilters.rvol || stock.rvol >= Number(appliedFilters.rvol);
        const gapMatch = !appliedFilters.gapMin || stock.gap >= Number(appliedFilters.gapMin);
        const sma50Match = !appliedFilters.sma50 || stock.sma50;
        const sma200Match = !appliedFilters.sma200 || stock.sma200;
        const macdMatch = !appliedFilters.macdCross || stock.macdCross;

        return searchMatch && sectorMatch && rvolMatch && gapMatch && sma50Match && sma200Match && macdMatch;
      });

      if (activeTab !== "all") {
        result = result.filter(stock => stock.signalType.toLowerCase().includes(activeTab) || stock.signalType.toLowerCase().replace(' ', '') === activeTab);
      }

      setFilteredStocks(result);
      setVisibleCount(INITIAL_ROWS);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [appliedFilters, activeTab, allStocks]);

  const visibleRows = useMemo(() => filteredStocks.slice(0, visibleCount), [filteredStocks, visibleCount]);

  const handleScroll = (e) => {
    if (loadingMore || visibleCount >= filteredStocks.length) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 12, filteredStocks.length));
        setLoadingMore(false);
      }, 600);
    }
  };

  const handleActivateScan = () => {
    setIsLoading(true);
    setAppliedFilters(filters);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const handleExport = () => {
    alert("Exporting scanner results to Excel... Check your downloads area.");
  };

  const handleSave = () => {
    alert("Screener configuration saved to your Trader Dashboard profile.");
  };

  const handleNewScreener = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelectedStock(null);
  };

  return (
    <div className={`relative screener-v2-layout overflow-hidden bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-[#dce9ff] ${sidebarCollapsed ? "sidebar-closed" : ""}`}>
      {}
      <div className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      {}
      <aside className="screener-v2-sidebar">
        <div className="sidebar-header">
           <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-blue-500" />
            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Scanner Params</span>}
           </div>
           <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="collapse-btn">
             {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
           </button>
        </div>
        
        {!sidebarCollapsed && (
          <div className="sidebar-content custom-scrollbar">
            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              onApply={handleActivateScan}
              onReset={() => {
                setFilters(DEFAULT_FILTERS);
                setAppliedFilters(DEFAULT_FILTERS);
              }}
              isOpen={true}
            />
          </div>
        )}
      </aside>

      {}
      <main className="screener-v2-main">
        {}
        <div className="intelligence-bar">
          <div className="market-status-group">
            <div className="market-stat-item">
              <span className="stat-label">NIFTY 50</span>
              <div className="flex items-center gap-1.5">
                <span className="stat-value text-green-500">22,453.10</span>
                <TrendingUp size={12} className="text-green-500" />
              </div>
            </div>
            <div className="divider" />
            <div className="market-stat-item">
              <span className="stat-label">Sentiment</span>
              <div className="flex items-center gap-1.5">
                <span className="stat-value text-amber-400">GREED</span>
                <Flame size={12} className="text-amber-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Universal Scan..." 
                  className="search-lite"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
             </div>
             <Header onSave={handleSave} onExport={handleExport} onNewScreener={handleNewScreener} />
          </div>
        </div>

        {}
        <div className="signal-tabs-container">
          <div className="signal-tabs">
            {SIGNAL_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`signal-tab ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.id && <motion.div layoutId="activeTab" className="tab-indicator" />}
              </button>
            ))}
          </div>
          <div className="pool-count">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
               <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
               <span className="text-[8px] font-black uppercase tracking-widest">Simulation Active</span>
            </div>
            <span className="ml-2 text-gray-500">{filteredStocks.length} ASSETS SCANNING</span>
          </div>
        </div>

        {}
        <div 
          className="content-area custom-scrollbar" 
          onScroll={handleScroll}
          ref={contentRef}
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-32">
               <div className="loading-orbit">
                  <div className="orbit-dot" />
               </div>
              <span className="mt-8 text-[11px] font-bold text-blue-500/50 uppercase tracking-[0.3em]">Calibrating Trader Dashboard</span>
            </div>
          ) : (
            <>
            <StockCardGrid 
                stocks={visibleRows} 
                onSelect={(symbol) => onStockDeepAnalysis(symbol)}
                selectedSymbol={selectedStock?.symbol}
                onDeepResearch={onStockDeepAnalysis}
              />
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              )}
            </>
          )}

          {}
          <AnimatePresence>
            {selectedStock && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[400px] z-[1000] p-4 bg-[#08162b]/95 backdrop-blur-xl border-l border-white/10 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
              >
                <StockDetailsPanel 
                  stock={selectedStock} 
                  onClose={() => setSelectedStock(null)} 
                  mode="research"
                  onResearchAction={(action) => alert(`Action "${action}" triggered for ${selectedStock.symbol}`)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {}
        <div className="actionable-feed-container">
           <div className="feed-header">
              <div className="flex items-center gap-2">
                <div className="pulse-dot" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Actionable Intelligence</span>
              </div>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Real-time Scanner v2.0</span>
           </div>
           <TerminalLogs mode="actionable" scanTimestamp={appliedFilters} />
        </div>
      </main>
    </div>
  );
}
