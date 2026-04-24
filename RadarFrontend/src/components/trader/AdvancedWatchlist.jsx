import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import {
  calculateTradeScore,
  getSignalTags,
  calculateTradeLevels,
  generateAIInsight,
  calculateRSI
} from "../../utils/traderLogic";

import { useAsset } from "../../context/AssetContext";
import StockDetailsPanel from "../watchlist/StockDetailsPanel";

const NOTES_KEY = "watchlist_notes_v2";
const WATCHLIST_KEY = "trader_terminal_watchlist_v1";

const Sparkline = ({ data, color, width = 80, height = 24 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height
  }));
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
    </svg>
  );
};

const TABS = ["Overview", "Performance", "Technicals", "Fundamentals", "Save View"];
const CATEGORIES = ["All", "Gainers", "Losers", "High Volume", "Custom"];
const SORTS = ["Custom", "Trade Score", "Change", "Volume"];

const TAB_CONFIGS = {
  "Overview": {
    gridClass: "grid grid-cols-[220px_140px_100px_100px_140px_120px_80px_120px]",
    headers: ["SYMBOL", "PRICE", "CHG %", "VOL", "P/E CHART", "NOTE", "OPEN", "ACTIONS"]
  },
  "Performance": {
    gridClass: "grid grid-cols-[220px_140px_100px_100px_140px_120px_80px_120px]",
    headers: ["SYMBOL", "PRICE", "1M CHG", "VOLUME", "RS SCORING", "NOTE", "OPEN", "ACTIONS"]
  },
  "Technicals": {
    gridClass: "grid grid-cols-[220px_140px_100px_100px_140px_120px_80px_120px]",
    headers: ["SYMBOL", "PRICE", "RSI", "VWAP", "EMA20", "NOTE", "OPEN", "ACTIONS"]
  },
  "Fundamentals": {
    gridClass: "grid grid-cols-[220px_140px_100px_100px_140px_120px_80px_120px]",
    headers: ["SYMBOL", "PRICE", "P/E", "DIV %", "EPS", "NOTE", "OPEN", "ACTIONS"]
  }
};

const MOCK_ROWS = [
  { symbol: "RELIANCE", company: "Reliance Industries", price: 2845.35, changePercent: 1.24, volume: 21200000, sector: "Energy" },
  { symbol: "HDFCBANK", company: "HDFC Bank", price: 1722.1, changePercent: 0.52, volume: 10500000, sector: "Financials" },
  { symbol: "INFY", company: "Infosys Ltd", price: 1510.25, changePercent: 0.88, volume: 12100000, sector: "IT" },
  { symbol: "TCS", company: "Tata Consultancy", price: 3845.4, changePercent: -0.31, volume: 4200000, sector: "IT" },
  { symbol: "SBIN", company: "State Bank of India", price: 812.45, changePercent: 2.15, volume: 25600000, sector: "Financials" },
  { symbol: "ICICIBANK", company: "ICICI Bank", price: 1142.6, changePercent: 1.06, volume: 15800000, sector: "Financials" },
  { symbol: "TATAMOTORS", company: "Tata Motors", price: 988.7, changePercent: 1.46, volume: 11200000, sector: "Auto" },
];

const EXTRA_MOCK_ROWS = [
  { symbol: "LT", company: "Larsen & Toubro", price: 3628.15, changePercent: 0.74, volume: 5900000, sector: "Industrials" },
  { symbol: "ITC", company: "ITC Limited", price: 462.8, changePercent: -0.22, volume: 17400000, sector: "FMCG" },
];

const makeSeed = (text) => String(text || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const buildDecoratedRow = (row) => {
  const seed = makeSeed(row.symbol);
  const changePercent = Number(row.changePercent || 0);
  const price = Number(row.price || 0);
  
  const chart = Array.from({ length: 20 }).map((_, i) => {
    const wave = Math.sin((seed + i * 11) * 0.2) * 5;
    const trendValue = changePercent * i * 0.4;
    return Number((price * (1 + (wave + trendValue) / 100)).toFixed(2));
  });

  const rsi = calculateRSI(chart);
  const vwap = price * (0.998 + (seed % 4) * 0.001);
  const ema20 = price * (1.002 - (seed % 5) * 0.001);
  const trend = rsi > 50 ? 'bullish' : 'bearish';
  const isVolumeSpike = Number(row.volume) > 15000000;
  
  const tradeScore = calculateTradeScore(price, rsi, trend, isVolumeSpike);
  const signals = getSignalTags(price, rsi, trend, vwap, row.volume, 10000000);
  const levels = calculateTradeLevels(price, trend);
  const aiInsight = generateAIInsight(row.symbol, tradeScore, signals, trend);

  const peRatio = (15 + (seed % 25)).toFixed(1);
  const divYield = (0.5 + (seed % 4) * 0.8).toFixed(2) + "%";
  const eps = (20 + (seed % 100)).toFixed(1);
  const marketCap = (seed % 2 === 0 ? "7.2T" : "1.4T");

  const rsRating = (40 + (seed % 50)).toFixed(1);
  const monthPerformance = (changePercent * 1.5 + (seed % 5) - 2.5).toFixed(2);

  return {
    ...row,
    name: row.company,
    percent: changePercent,
    tradeScore,
    signals,
    levels,
    aiInsight,
    trend,
    chart,
    rsiVal: rsi.toFixed(1),
    vwapVal: vwap.toFixed(2),
    ema20Val: ema20.toFixed(2),
    peRatio,
    divYield,
    eps,
    marketCap,
    rsRating,
    monthPerformance,
    assetType: seed % 3 === 0 ? 'D' : 'E'
  };
};

const AdvancedWatchlist = ({ onSymbolSelect }) => {
  const navigate = useNavigate();
  const { setAsset } = useAsset();

  const [rows, setRows] = useState([]);
  const [lastTick, setLastTick] = useState({}); // Tracking tick state for animations {symbol: 'up'|'down'}
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [sortBy, setSortBy] = useState("Trade Score");
  const [selectedRow, setSelectedRow] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [uiNotice, setUiNotice] = useState(null);
  const [focusedRowsMode, setFocusedRowsMode] = useState(false);
  const [rowDrawerOpen, setRowDrawerOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [focusedSymbols, setFocusedSymbols] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    const timer = window.setTimeout(() => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRows(parsed.map(buildDecoratedRow));
            setIsLoading(false);
            return;
          }
        } catch (e) { console.error("Failed to load watchlist", e); }
      }
      setRows([...MOCK_ROWS, ...EXTRA_MOCK_ROWS].map(buildDecoratedRow));
      setIsLoading(false);
    }, 400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(NOTES_KEY);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (e) {
      console.error("Failed to load notes", e);
    }
  }, []);

  useEffect(() => {
    if (isLoading || rows.length === 0) return;

    const interval = setInterval(() => {
      setRows(prevRows => {
        const count = Math.min(prevRows.length, 2 + Math.floor(Math.random() * 2));
        const indices = new Set();
        while (indices.size < count) indices.add(Math.floor(Math.random() * prevRows.length));

        const nextTickState = {};
        const nextRows = prevRows.map((row, idx) => {
          if (!indices.has(idx)) return row;

          const change = 1 + (Math.random() * 0.003 - 0.0015); // Â±0.15% fluctuation
          const nextPrice = row.price * change;
          const tickDir = nextPrice > row.price ? 'up' : 'down';
          nextTickState[row.symbol] = tickDir;

          const nextChart = [...row.chart.slice(1), nextPrice];
          const nextRsi = calculateRSI(nextChart);
          
          return {
            ...row,
            price: nextPrice,
            percent: row.percent + (change - 1) * 100,
            chart: nextChart,
            rsi: nextRsi,
            tradeScore: calculateTradeScore(nextPrice, nextRsi, row.trend, nextPrice > row.price * 1.001),
            aiInsight: generateAIInsight(row.symbol, row.tradeScore, row.signals, row.trend),
          };
        });

        setLastTick(nextTickState);
        setTimeout(() => setLastTick({}), 1000); // Reset tick anim state

        return nextRows;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading, rows.length]);

  useEffect(() => {
    if (!isLoading && rows.length > 0) {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(rows));
    }
  }, [rows.length, isLoading]);

  const pushNotice = (text, action = null) => {
    setUiNotice({ text, action });
    window.clearTimeout(pushNotice._t);
    pushNotice._t = window.setTimeout(() => setUiNotice(null), action ? 5000 : 2200);
  };

  const handleFocusedRowsToggle = () => {
    setFocusedRowsMode(!focusedRowsMode);
    if (!focusedRowsMode) {
      pushNotice("Focused Rows mode ON - Select rows to focus");
      const highScoreSymbols = new Set(
        rows
          .filter(r => r.tradeScore > 75)
          .slice(0, 5)
          .map(r => r.symbol)
      );
      setFocusedSymbols(highScoreSymbols);
    } else {
      setFocusedSymbols(new Set());
      pushNotice("Focused Rows mode OFF");
    }
  };

  const handleRowDrawerToggle = () => {
    setRowDrawerOpen(!rowDrawerOpen);
    if (!rowDrawerOpen && !selectedRow) {
      pushNotice("Row Drawer opened - Select a row to view details");
    }
  };

  const handleNotesToggle = () => {
    if (!selectedRow) {
      pushNotice("Select a row first to add notes");
      return;
    }
    setCurrentNote(notes[selectedRow.symbol] || "");
    setNotesModalOpen(true);
  };

  const saveNote = (symbol, noteText) => {
    const updatedNotes = { ...notes, [symbol]: noteText };
    setNotes(updatedNotes);
    localStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
    pushNotice(`Note saved for ${symbol}`);
  };

  const toggleFocusedSymbol = (symbol) => {
    const updated = new Set(focusedSymbols);
    if (updated.has(symbol)) {
      updated.delete(symbol);
    } else {
      updated.add(symbol);
    }
    setFocusedSymbols(updated);
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = rows.filter((row) => {
      if (q && !`${row.symbol} ${row.name}`.toLowerCase().includes(q)) return false;
      if (focusedRowsMode && focusedSymbols.size > 0 && !focusedSymbols.has(row.symbol)) return false;
      return true;
    });

    if (sortBy === "Trade Score") next.sort((a, b) => b.tradeScore - a.tradeScore);
    if (sortBy === "Change") next.sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));
    if (sortBy === "Volume") next.sort((a, b) => b.volume - a.volume);

    return next;
  }, [query, rows, sortBy, focusedRowsMode, focusedSymbols]);

  const insightStats = useMemo(() => {
    if (!filteredRows.length) return { strong: 0, weak: 0, meanRsi: 0 };
    const strong = filteredRows.filter(r => r.tradeScore > 75).length;
    const weak = filteredRows.filter(r => r.tradeScore < 40).length;
    const meanRsi = filteredRows.reduce((a, b) => a + calculateRSI(b.chart), 0) / filteredRows.length;
    return { strong, weak, meanRsi: meanRsi.toFixed(1) };
  }, [filteredRows]);

  const openSymbol = (row) => {
    if (onSymbolSelect) {
        onSymbolSelect(row.symbol);
    } else {
        setAsset(row.symbol, "stock");
        navigate(`/stocks/${row.symbol}`);
    }
  };

  const closeDrawer = () => setSelectedRow(null);

  const handleDeleteSymbol = (e, symbol) => {
    e.stopPropagation();
    const doomedIndex = rows.findIndex(r => r.symbol === symbol);
    if (doomedIndex === -1) return;

    const doomedRow = rows[doomedIndex];
    setLastDeleted({ row: doomedRow, index: doomedIndex });
    
    setRows(prev => prev.filter(r => r.symbol !== symbol));
    pushNotice(`${symbol} removed from terminal`, {
      label: "UNDO",
      handler: () => {
        setRows(prev => {
          const next = [...prev];
          next.splice(doomedIndex, 0, doomedRow);
          return next;
        });
        setUiNotice(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-cyan-400">
        <Activity className="animate-pulse mr-2" /> Syncing market intelligence...
      </div>
    );
  }
  return (
    <div className="relative w-full overflow-hidden px-6 py-6 min-h-screen text-slate-200">

      {}
      <div className="relative z-10 space-y-8">
        {}
        <div className="flex items-center justify-between gap-4 flex-wrap px-1">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
               <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Market Open
             </div>
             <div className="flex flex-col">
                <h3 className="text-[13px] font-black tracking-[0.2em] text-white/90 uppercase">Trader Dashboard Watchlist</h3>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">Fast-moving watchlist, note-taking, live stats, and row-level drawer details in a denser terminal layout.</p>
             </div>
          </div>

          <div className="flex items-center gap-2">
             {['Focused Rows', 'Row Drawer', 'Notes'].map(btn => (
               <button 
                 key={btn} 
                 onClick={() => {
                   if (btn === 'Focused Rows') handleFocusedRowsToggle();
                   if (btn === 'Row Drawer') handleRowDrawerToggle();
                   if (btn === 'Notes') handleNotesToggle();
                 }}
                 className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                   (btn === 'Row Drawer' && rowDrawerOpen) || 
                   (btn === 'Focused Rows' && focusedRowsMode) || 
                   (btn === 'Notes' && notesModalOpen)
                     ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50' 
                     : 'bg-slate-900/40 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-400'
                 }`}
               >
                 {btn}
               </button>
             ))}
          </div>
        </div>

        {}
        <div className="flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div className="flex bg-slate-900/80 border border-white/5 p-1 rounded-xl gap-1">
                {TABS.map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === tab ? 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {tab}
                    </button>
                ))}
              </div>
           </div>
        </div>

        {}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 px-1">
           <div className="col-span-1 lg:col-span-2 rounded-xl border border-white/5 bg-slate-900/40 p-4 transition-all hover:border-slate-700">
              <div className="text-[9px] uppercase font-black tracking-widest text-[#2ecc71]">Top Gainer</div>
              <div className="flex items-center justify-between mt-2">
                 <div className="text-xl font-black text-white">SBIN</div>
                 <div className="text-xs font-bold text-emerald-400">+2.15%</div>
              </div>
           </div>
           <div className="col-span-1 lg:col-span-2 rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 transition-all hover:border-rose-500/30">
              <div className="text-[9px] uppercase font-black tracking-widest text-rose-500">Top Loser</div>
              <div className="flex items-center justify-between mt-2">
                 <div className="text-xl font-black text-white">TCS</div>
                 <div className="text-xs font-bold text-rose-500">-0.31%</div>
              </div>
           </div>
           <div className="col-span-1 lg:col-span-2 rounded-xl border border-white/5 bg-[#0a1122]/80 p-4 transition-all hover:border-slate-700">
              <div className="text-[9px] uppercase font-black tracking-widest text-cyan-400">Most Active</div>
              <div className="flex items-center justify-between mt-2">
                 <div className="text-xl font-black text-white">SBIN</div>
                 <div className="text-[10px] font-bold text-slate-400">2.6Cr volume</div>
              </div>
           </div>
           <div className="hidden lg:block h-full w-[1px] bg-white/5 mx-auto" />
           
           <div className="col-span-1 lg:col-span-1 rounded-xl border border-white/5 bg-slate-900/20 p-4">
              <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Avg Rel Strength</div>
              <div className="mt-2 text-2xl font-black text-white">60.2</div>
              <div className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">cross-symbol momentum score</div>
           </div>
           <div className="col-span-1 lg:col-span-1 rounded-xl border border-white/5 bg-slate-900/20 p-4">
              <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">High Conviction</div>
              <div className="mt-2 text-2xl font-black text-cyan-400">0</div>
              <div className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">momentum + RS alignment</div>
           </div>
           <div className="col-span-1 lg:col-span-1 rounded-xl border border-white/5 bg-slate-900/20 p-4">
              <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Fragile Setups</div>
              <div className="mt-2 text-2xl font-black text-rose-500">0</div>
              <div className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">weak structure symbols</div>
           </div>
           <div className="col-span-1 lg:col-span-1 rounded-xl border border-white/5 bg-slate-900/20 p-4">
              <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Mean RSI</div>
              <div className="mt-2 text-2xl font-black text-white">67</div>
              <div className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">breadth pressure read</div>
           </div>
        </div>

        {}
        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 px-4">
           <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter symbols in terminal..."
                className="w-72 h-10 bg-[#09172e] border border-white/10 rounded-xl pl-11 pr-4 text-xs text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-slate-600"
              />
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setSortBy(prev => SORTS[(SORTS.indexOf(prev) + 1) % SORTS.length])}
                className="flex items-center gap-2 px-3 h-10 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 transition-all"
              >
                <SlidersHorizontal size={12} /> Sort: {sortBy}
              </button>
              <button 
                onClick={() => {
                  pushNotice("Adding random ticker...");
                  setRows(prev => [...prev, buildDecoratedRow(EXTRA_MOCK_ROWS[Math.floor(Math.random() * EXTRA_MOCK_ROWS.length)])]);
                }}
                className="flex items-center gap-2 px-4 h-10 bg-cyan-600 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-900/40 hover:bg-cyan-500 transition-all"
              >
                <Plus size={14} /> ADD TICKER
              </button>
           </div>
        </div>

        {}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-9 space-y-4">
              <div className={`${TAB_CONFIGS[activeTab]?.gridClass || 'grid grid-cols-[220px_140px_100px_100px_140px_120px_80px_120px]'} gap-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 border-b border-white/5 pb-3 mb-2`}>
                 {(TAB_CONFIGS[activeTab]?.headers || []).map((h, i) => (
                   <span key={i} className={i === 1 ? "text-right" : (i > 4) ? "text-center" : ""}>{h}</span>
                 ))}
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                 <AnimatePresence>
                 {filteredRows.map((row) => {
                   const isPositive = row.percent >= 0;

                   return (
                     <motion.div
                       layout
                       key={row.symbol}
                       initial={{ opacity: 0, y: 5 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0 }}
                       transition={{ 
                         opacity: { duration: 0.2 },
                         layout: { type: "spring", stiffness: 300, damping: 30 }
                       }}
                       whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                       onClick={() => {
                         if (focusedRowsMode) {
                           toggleFocusedSymbol(row.symbol);
                         } else {
                           setSelectedRow(row);
                           if (rowDrawerOpen) {
                             setRowDrawerOpen(true);
                           }
                         }
                       }}
                       className={`group cursor-pointer border-b border-white/[0.03] py-4 px-4 transition-all duration-200 rounded-xl ${
                         focusedSymbols.has(row.symbol) ? 'bg-cyan-900/20 border-cyan-500/30' : 'hover:bg-white/[0.01]'
                       }`}
                     >
                       <div className={`${TAB_CONFIGS[activeTab]?.gridClass || 'grid grid-cols-[220px_140px_100px_100px_140px_120px_80px_120px]'} gap-4 items-center`}>
                         {}
                         <div className="flex items-center gap-4">
                           <div className={`h-11 w-11 flex items-center justify-center rounded-xl font-black text-xs border border-white/10 bg-white/5 text-emerald-400`}>
                             {row.symbol.charAt(0)}
                           </div>
                           <div className="flex flex-col min-w-0">
                             <div className="flex items-center gap-2">
                                <span className="text-[17px] font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors uppercase">{row.symbol}</span>
                                <div className="flex items-center gap-1">
                                   <span className="flex items-center justify-center h-4 w-4 rounded-full bg-cyan-900/50 border border-cyan-400/20 text-[9px] font-black text-cyan-200">
                                      {row.assetType}
                                   </span>
                                   <span className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-white/10 text-[8px] font-black text-slate-400 tracking-tighter">WATCH</span>
                                </div>
                             </div>
                             <div className="text-[11px] font-medium text-slate-600 truncate -mt-0.5">{row.name}</div>
                             <div className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-tighter">
                                RS {row.rsRating} | 1M <span className={row.monthPerformance >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}>
                                   {row.monthPerformance >= 0 ? '+' : ''}{row.monthPerformance}%
                                </span>
                             </div>
                           </div>
                         </div>

                         {}
                         <div className="text-right flex flex-col items-end">
                           <motion.span 
                             key={row.price}
                             initial={{ color: "#fff" }}
                             animate={{ color: "#fff" }}
                             className="text-lg font-black tracking-tighter"
                           >
                             â‚¹{row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </motion.span>
                         </div>

                         {}
                         <div className="flex justify-center">
                            <span className={`text-[13px] font-black ${isPositive ? 'text-[#2ecc71]' : 'text-rose-500'}`}>
                               {isPositive ? '+' : ''}{row.percent.toFixed(2)}%
                            </span>
                         </div>

                         {}
                         <div className="text-center">
                            <span className="text-[11px] font-bold text-slate-400">
                               {(row.volume / 10000000).toFixed(1)}Cr
                            </span>
                         </div>

                         {}
                         <div className="flex justify-center flex-col items-center">
                            {activeTab === "Overview" ? (
                               <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-bold text-slate-300">{row.peRatio}</span>
                                  <Sparkline data={row.chart} color={isPositive ? "#10b981" : "#f43f5e"} />
                               </div>
                            ) : (
                               <span className="text-[11px] font-bold text-slate-300">â‚¹{row.vwapVal || row.peRatio}</span>
                            )}
                         </div>

                         {}
                         <div className="flex justify-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRow(row);
                                setCurrentNote(notes[row.symbol] || "");
                                setNotesModalOpen(true);
                              }}
                              className="h-9 w-9 flex items-center justify-center rounded-xl bg-cyan-900/10 border border-cyan-400/10 text-cyan-400/40 hover:text-cyan-400 hover:bg-cyan-900/30 transition-all"
                              title="Add/Edit Note"
                            >
                               <Activity size={14} />
                            </button>
                         </div>

                         {}
                         <div className="flex justify-center">
                            <button 
                               onClick={(e) => { e.stopPropagation(); openSymbol(row); }}
                               className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 text-slate-500 hover:text-white hover:border-white/30 transition-all group"
                            >
                               <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                         </div>

                         {}
                         <div className="flex justify-center">
                            <div className="inline-flex items-center gap-1 opacity-100 transition-opacity duration-150">
                               <button
                                 onClick={(e) => { e.stopPropagation(); pushNotice(`Alert set for ${row.symbol}`); }}
                                 className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-cyan-900/10 border border-cyan-400/10 text-cyan-300/60 hover:text-cyan-300 hover:bg-cyan-900/30"
                                 title="Set Alert"
                               >
                                 <span className="text-xs">ðŸ””</span>
                               </button>
                               <button
                                 onClick={(e) => { e.stopPropagation(); openSymbol(row); }}
                                 className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:border-white/30"
                                 title="View"
                               >
                                 <span className="text-sm">â€º</span>
                               </button>
                               <button
                                 onClick={(e) => handleDeleteSymbol(e, row.symbol)}
                                 className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-900/20 border border-rose-400/30 text-rose-300 hover:text-rose-200 hover:bg-rose-900/35"
                                 title="Delete"
                               >
                                 <span className="text-xs">âœ•</span>
                               </button>
                            </div>
                         </div>
                       </div>
                     </motion.div>
                   );
                 })}
                 </AnimatePresence>
              </div>
           </div>

           {}
           <div className={`col-span-12 xl:col-span-3 min-h-[500px] transition-all ${!rowDrawerOpen && 'hidden xl:block'}`}>
             <AnimatePresence mode="wait">
               {selectedRow && rowDrawerOpen ? (
                 <motion.div 
                     key={selectedRow.symbol} 
                     initial={{ opacity: 0, x: 20 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     exit={{ opacity: 0, x: 20 }}
                     className="h-full"
                 >
                    <StockDetailsPanel 
                       stock={selectedRow}
                       mode="research"
                       onClose={closeDrawer}
                       onAddAlert={() => pushNotice(`Alert set for ${selectedRow.symbol}`)}
                       onResearchAction={(action) => {
                          if (action === 'focus') openSymbol(selectedRow);
                          pushNotice(`${action} triggered for ${selectedRow.symbol}`);
                       }}
                    />
                 </motion.div>
               ) : (
                 <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }}
                     className="h-full rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 flex flex-col justify-between backdrop-blur-2xl shadow-[0_22px_70px_rgba(0,0,0,0.4)]"
                 >
                   <div>
                     <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                         <Activity className="text-cyan-400" size={20} />
                     </div>
                     <h4 className="text-xl font-black text-white leading-tight">Terminal Active</h4>
                     <p className="mt-3 text-[#7f95b8] text-xs leading-relaxed">
                         {rowDrawerOpen ? 'Select ticker to view deep technical snapshots, volume profile, and setup analytics.' : 'Click "ROW DRAWER" button to open the details panel.'}
                     </p>
                     
                     <div className="mt-6 space-y-3">
                         <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                             <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Terminal Pulse</div>
                             <div className="mt-1 text-[10px] text-emerald-100/60 leading-tight">Scanning 42 data points per row.</div>
                         </div>
                         <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                             <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">Risk Advisor</div>
                             <div className="mt-1 text-[10px] text-amber-100/60 leading-tight">Auto stop-loss and target active.</div>
                         </div>
                     </div>
                   </div>

                   <div className="pt-4 border-t border-white/5">
                       <div className="text-[9px] font-black uppercase tracking-widest text-[#5d6b7a] mb-2">Trader Engine</div>
                       <div className="flex items-center gap-2">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                           <span className="text-[10px] font-bold text-slate-400">Core v4.1 Ready</span>
                       </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>

        {}
        <AnimatePresence>
          {notesModalOpen && selectedRow && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setNotesModalOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 shadow-2xl z-50"
              >
                <h3 className="text-lg font-black text-white mb-4">Add Note for {selectedRow.symbol}</h3>
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Write your analysis, trade setup, or observations..."
                  className="w-full h-32 bg-slate-800/50 border border-white/10 rounded-lg p-3 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 outline-none resize-none"
                />
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => setNotesModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      saveNote(selectedRow.symbol, currentNote);
                      setNotesModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 hover:bg-cyan-500 transition-all"
                  >
                    Save Note
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {}
        <AnimatePresence>
          {uiNotice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-6 bg-slate-900 border border-white/10 rounded-lg p-4 text-xs text-slate-200 max-w-xs shadow-lg z-50 flex items-center justify-between gap-3"
            >
              <span>{uiNotice.text}</span>
              {uiNotice.action && (
                <button
                  onClick={uiNotice.action.handler}
                  className="px-3 py-1 rounded bg-cyan-600/20 text-cyan-400 font-bold hover:bg-cyan-600/30 transition-all"
                >
                  {uiNotice.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvancedWatchlist;
