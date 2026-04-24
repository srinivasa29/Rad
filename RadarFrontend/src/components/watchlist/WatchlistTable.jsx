import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Bell, ChevronRight, Star, Trash2, TrendingDown, TrendingUp, Newspaper } from 'lucide-react';
import { NewsBadge, SentimentDisplay } from './EnhancedWatchlistComponents';

const GRID_COLUMNS = [
  { key: 'trend', label: 'Trend', sortable: false, visible: true, grid: 'minmax(130px, 1.05fr)' },
  { key: 'symbol', label: 'Symbol', sortable: false, visible: true, grid: 'minmax(220px, 1.5fr)' },
  { key: 'price', label: 'Price', sortable: true, visible: true, grid: 'minmax(120px, 0.8fr)' },
  { key: 'change', label: 'Change', sortable: true, visible: true, grid: 'minmax(120px, 0.85fr)' },
  { key: 'percent', label: '% Chg', sortable: true, visible: true, grid: 'minmax(110px, 0.8fr)' },
  { key: 'volume', label: 'Volume', sortable: true, visible: true, grid: 'minmax(118px, 0.85fr)' },
  { key: 'marketCap', label: 'Market Cap', sortable: true, visible: true, grid: 'minmax(130px, 0.9fr)' },
  { key: 'rsi', label: 'RSI', sortable: true, visible: true, grid: 'minmax(90px, 0.7fr)' },
  { key: 'macd', label: 'MACD', sortable: true, visible: true, grid: 'minmax(110px, 0.8fr)' },
  { key: 'high52w', label: '52W High', sortable: true, visible: true, grid: 'minmax(110px, 0.8fr)' },
  { key: 'low52w', label: '52W Low', sortable: true, visible: true, grid: 'minmax(110px, 0.8fr)' },
  { key: 'vwap', label: 'VWAP', sortable: true, visible: true, grid: 'minmax(110px, 0.8fr)' },
  { key: 'news', label: 'News', sortable: false, visible: true, grid: 'minmax(100px, 0.7fr)' }, // NEW
  { key: 'sentiment', label: 'Sentiment', sortable: false, visible: true, grid: 'minmax(120px, 0.8fr)' }, // NEW
  { key: 'actions', label: 'Actions', sortable: false, visible: true, grid: 'minmax(180px, 1fr)' },
];

const compactCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
};

const formatMoney = (value) => `â‚¹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const makeSeed = (text) => String(text || '').split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);

const buildSparkSeries = (stock) => {
  const seed = makeSeed(stock.symbol);
  const base = Number(stock.price || 0);
  const direction = Number(stock.change || 0) >= 0 ? 1 : -1;

  return Array.from({ length: 18 }, (_, index) => {
    const wave = Math.sin(seed * 0.025 + index * 0.45) * base * 0.008;
    const drift = ((index - 9) / 9) * base * (Number(stock.percent || 0) / 100) * 0.9;
    const bias = direction * (index / 17) * base * 0.01;
    return Number((base + wave + drift + bias).toFixed(2));
  });
};

const pathFromSeries = (series, width = 118, height = 38) => {
  if (!Array.isArray(series) || series.length < 2) return { line: '', area: '' };

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series.map((value, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x: x.toFixed(2), y: y.toFixed(2) };
  });

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const area = `${line} L ${width},${height} L 0,${height} Z`;

  return { line, area };
};

const TooltipButton = ({ label, onClick, children, tone = 'slate' }) => {
  const tones = {
    slate: 'border-white/10 bg-slate-950/70 text-slate-200 hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-cyan-100',
    green: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:border-emerald-300/40 hover:bg-emerald-400/15',
    amber: 'border-amber-400/20 bg-amber-500/10 text-amber-200 hover:border-amber-300/40 hover:bg-amber-400/15',
    rose: 'border-rose-400/25 bg-rose-500/12 text-rose-200 hover:border-rose-300/45 hover:bg-rose-400/20',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.22)] ${tones[tone] || tones.slate}`}
    >
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-100 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
      {children}
    </button>
  );
};

const Sparkline = ({ stock }) => {
  const series = useMemo(() => buildSparkSeries(stock), [stock.symbol, stock.price, stock.change, stock.percent]);
  const { line, area } = useMemo(() => pathFromSeries(series), [series]);
  const positive = Number(stock.change || 0) >= 0;
  const lineColor = positive ? '#34d399' : '#fb7185';
  const gradientId = `spark-gradient-${stock.id}`;

  return (
    <motion.svg
      viewBox="0 0 118 38"
      className="h-[38px] w-full"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
          <stop offset="50%" stopColor={lineColor} stopOpacity="0.75" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${gradientId}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${gradientId}-fill)`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${gradientId}-glow)`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </motion.svg>
  );
};

const WatchlistTable = ({
  stocks,
  columnVisibility,
  sortConfig,
  onSort,
  onSelectStock,
  onAddAlert,
  onRemoveStock,
  selectedStockId,
  newsData = {}, // NEW: News data prop
  getNewsInfo = () => ({}), // NEW: Get news info function
  viewMode = 'expanded', // NEW: View mode
}) => {
  const [flashMap, setFlashMap] = useState({});
  const [pinnedIds, setPinnedIds] = useState(() => new Set());
  const previousSnapshot = useRef({});
  const flashTimers = useRef({});

  useEffect(() => {
    const nextSnapshot = {};

    stocks.forEach((stock) => {
      const snapshot = `${stock.price}|${stock.change}|${stock.percent}|${stock.volume}`;
      nextSnapshot[stock.id] = snapshot;

      if (previousSnapshot.current[stock.id] && previousSnapshot.current[stock.id] !== snapshot) {
        setFlashMap((current) => ({ ...current, [stock.id]: true }));

        if (flashTimers.current[stock.id]) {
          clearTimeout(flashTimers.current[stock.id]);
        }

        flashTimers.current[stock.id] = window.setTimeout(() => {
          setFlashMap((current) => ({ ...current, [stock.id]: false }));
        }, 650);
      }
    });

    previousSnapshot.current = nextSnapshot;

    return () => {
      Object.values(flashTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, [stocks]);

  const topStrip = useMemo(() => {
    if (!Array.isArray(stocks) || stocks.length === 0) {
      return {
        gainer: null,
        loser: null,
        active: null,
      };
    }

    const sortedByChange = [...stocks].sort((left, right) => Number(right.percent || 0) - Number(left.percent || 0));
    const sortedByVolume = [...stocks].sort((left, right) => Number(right.volume || 0) - Number(left.volume || 0));

    return {
      gainer: sortedByChange[0],
      loser: sortedByChange[sortedByChange.length - 1],
      active: sortedByVolume[0],
    };
  }, [stocks]);

  const visibleColumns = useMemo(
    () => GRID_COLUMNS.filter((column) => column.visible && (column.key === 'trend' || column.key === 'actions' || columnVisibility[column.key] !== false)),
    [columnVisibility]
  );

  const gridTemplateColumns = useMemo(
    () => visibleColumns.map((column) => column.grid).join(' '),
    [visibleColumns]
  );

  const setPinned = (stockId) => {
    setPinnedIds((current) => {
      const next = new Set(current);
      if (next.has(stockId)) {
        next.delete(stockId);
      } else {
        next.add(stockId);
      }
      return next;
    });
  };

  const renderTopCard = (title, stock, gradientClass, icon, valueLabel) => {
    if (!stock) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-400">
          <div className="text-[11px] uppercase tracking-[0.24em]">{title}</div>
          <div className="mt-2 text-sm">No data</div>
        </div>
      );
    }

    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        className={`overflow-hidden rounded-2xl border px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)] ${gradientClass}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">{title}</div>
            <div className="mt-2 text-2xl font-black text-white leading-none">{stock.symbol}</div>
            <div className="mt-1 text-sm text-white/75">{stock.name}</div>
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 p-3 text-white">{icon}</div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-black text-white leading-none">{valueLabel(stock)}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/70">Live update</div>
          </div>
          <div className="text-right text-xs uppercase tracking-[0.18em] text-white/75">
            <div>{title === 'Most Active' ? compactCurrency(stock.volume) : `${stock.percent > 0 ? '+' : ''}${Number(stock.percent || 0).toFixed(2)}%`}</div>
            <div className="mt-1">{title === 'Most Active' ? 'Volume' : 'Change'}</div>
          </div>
        </div>
      </motion.div>
    );
  };

  const rows = Array.isArray(stocks) ? stocks : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border overflow-hidden"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 24px 80px rgba(37, 99, 235, 0.18), 0 0 0 1px rgba(59, 130, 246, 0.05)',
      }}
    >
      <div className="border-b border-blue-400/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 md:px-5 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Watchlist terminal</p>
            <h3 className="text-lg md:text-xl font-black tracking-tight text-white">Microstructure matrix</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-100">
              <Bell size={13} className="text-cyan-300" />
              Quick alerts
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-100">
              <Star size={13} className="text-amber-300" />
              Pinned rows
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-white/5 px-4 md:px-5 py-4 md:grid-cols-3">
        {renderTopCard('Top Gainer', topStrip.gainer, 'bg-[linear-gradient(145deg,rgba(5,150,105,0.32),rgba(6,95,70,0.28))] border-emerald-400/20', <TrendingUp size={18} />, (stock) => `+${Number(stock.percent || 0).toFixed(2)}%`)}
        {renderTopCard('Top Loser', topStrip.loser, 'bg-[linear-gradient(145deg,rgba(185,28,28,0.32),rgba(127,29,29,0.28))] border-rose-400/20', <TrendingDown size={18} />, (stock) => `${Number(stock.percent || 0).toFixed(2)}%`)}
        {renderTopCard('Most Active', topStrip.active, 'bg-[linear-gradient(145deg,rgba(29,78,216,0.34),rgba(30,64,175,0.28))] border-sky-400/20', <ChevronRight size={18} />, (stock) => compactCurrency(stock.volume))}
      </div>

      <div className="max-h-[calc(100vh-430px)] overflow-y-auto custom-scrollbar px-4 md:px-5 py-4">
        <div className="sticky top-0 z-20 mb-3 rounded-2xl border border-slate-700/60 shadow-[0_8px_24px_rgba(0,0,0,0.22)]" style={{ background: 'linear-gradient(to right, #0f172a, #1e293b)', boxShadow: 'inset 0 -1px 0 rgba(59,130,246,0.35), 0 8px 24px rgba(0,0,0,0.28)' }}>
          <div className="grid gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-300" style={{ gridTemplateColumns }}>
            {visibleColumns.map((column) => (
              <div key={column.key} className={column.key === 'actions' ? 'text-center' : ''}>
                {column.sortable ? (
                  <button type="button" onClick={() => onSort(column.key)} className="group inline-flex items-center gap-1.5 transition-colors hover:text-cyan-200">
                    <span>{column.label}</span>
                    {sortConfig.key === column.key && (
                      <span className="text-cyan-300">{sortConfig.direction === 'asc' ? 'â†‘' : 'â†“'}</span>
                    )}
                  </button>
                ) : (
                  <span>{column.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="space-y-3 pb-2">
            {rows.map((stock, index) => {
              const isPositive = Number(stock.change || 0) >= 0;
              const isSelected = selectedStockId === stock.id;
              const isPinned = pinnedIds.has(stock.id);
              const isFlashing = !!flashMap[stock.id];

              return (
                <motion.button
                  key={stock.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035, duration: 0.28 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  onClick={() => onSelectStock(stock)}
                  className={`group w-full rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                    isSelected
                      ? 'border-cyan-300/50 bg-[rgba(30,41,59,0.85)] shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_16px_30px_rgba(8,145,178,0.18)]'
                      : 'border-slate-700/70 bg-[rgba(30,41,59,0.6)] hover:border-cyan-300/35 hover:bg-[rgba(30,41,59,0.78)]'
                  } ${isPinned ? 'ring-1 ring-amber-300/30' : ''}`}
                  style={{
                    boxShadow: isSelected
                      ? '0 18px 40px rgba(2, 132, 199, 0.18), 0 0 0 1px rgba(34,211,238,0.14)'
                      : '0 10px 24px rgba(0,0,0,0.16)',
                  }}
                >
                  <div className="grid items-center gap-2" style={{ gridTemplateColumns }}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-black uppercase shadow-[0_0_20px_rgba(59,130,246,0.14)] ${isPositive ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200' : 'border-rose-400/35 bg-rose-500/15 text-rose-200'}`}>
                        {String(stock.symbol || '?').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-black tracking-tight text-white">{stock.symbol}</span>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${stock.status === 'breakout' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-sky-400/25 bg-sky-400/10 text-sky-200'}`}>
                            {stock.status === 'breakout' ? 'E' : 'D'}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-300">{stock.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                      <div className="min-w-[124px]">
                        <Sparkline stock={stock} />
                      </div>
                      <div className="hidden md:block text-[10px] uppercase tracking-[0.18em] text-slate-400">Momentum</div>
                    </div>

                    <div className="text-[15px] font-black leading-none text-white">
                      {isFlashing ? (
                        <motion.span animate={{ opacity: [1, 0.35, 1], scale: [1, 1.04, 1] }} transition={{ duration: 0.65 }} className="inline-block">
                          {formatMoney(stock.price)}
                        </motion.span>
                      ) : (
                        formatMoney(stock.price)
                      )}
                    </div>

                    <div className={`text-[14px] font-black leading-none ${isPositive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]'}`}>
                      <span className="inline-flex items-center gap-1">
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isPositive ? '+' : ''}{Number(stock.change || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className={`text-[14px] font-black leading-none ${isPositive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]'}`}>
                      {stock.percent > 0 ? '+' : ''}{Number(stock.percent || 0).toFixed(2)}%
                    </div>

                    <div className="text-sm font-semibold text-slate-200">{compactCurrency(stock.volume)}</div>
                    <div className="text-sm font-semibold text-slate-200">{compactCurrency(stock.marketCap)}</div>
                    <div className="inline-flex justify-center rounded-lg border border-white/8 bg-white/[0.04] px-2.5 py-1 text-xs font-black text-slate-100">{Number(stock.rsi || 0).toFixed(1)}</div>
                    <div className={`inline-flex justify-center rounded-lg px-2.5 py-1 text-xs font-black capitalize ${stock.macd === 'bullish' ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : stock.macd === 'bearish' ? 'border border-rose-400/20 bg-rose-500/10 text-rose-300' : 'border border-slate-500/20 bg-slate-700/20 text-slate-200'}`}>
                      {stock.macd}
                    </div>
                    <div className="text-sm font-semibold text-slate-200">{formatMoney(stock.high52w)}</div>
                    <div className="text-sm font-semibold text-slate-200">{formatMoney(stock.low52w)}</div>
                    <div className="text-sm font-semibold text-slate-200">{formatMoney(stock.vwap)}</div>

                    {}
                    <div className="flex items-center justify-center">
                      {(() => {
                        const newsInfo = getNewsInfo(stock.symbol);
                        return (
                          <NewsBadge
                            count={newsInfo.count || 0}
                            hasToday={newsInfo.hasToday || false}
                            unread={newsInfo.unread || 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View news for', stock.symbol);
                            }}
                          />
                        );
                      })()}
                    </div>

                    {}
                    <div className="flex items-center justify-center">
                      {(() => {
                        const newsInfo = getNewsInfo(stock.symbol);
                        return newsInfo.sentiment !== undefined ? (
                          <SentimentDisplay sentiment={newsInfo.sentiment} compact={viewMode === 'compact'} />
                        ) : (
                          <span className="text-xs text-slate-500">N/A</span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <TooltipButton
                        label={isPinned ? 'Unpin' : 'Pin row'}
                        tone={isPinned ? 'amber' : 'slate'}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPinned(stock.id);
                        }}
                      >
                        <Star size={15} className={isPinned ? 'fill-current text-amber-300' : 'text-current'} />
                      </TooltipButton>
                      <TooltipButton
                        label="Add alert"
                        tone="green"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddAlert(stock);
                        }}
                      >
                        <Bell size={15} />
                      </TooltipButton>
                      <TooltipButton
                        label="Open drawer"
                        tone="slate"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectStock(stock);
                        }}
                      >
                        <ChevronRight size={15} />
                      </TooltipButton>
                      <TooltipButton
                        label="Delete"
                        tone="rose"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveStock?.(stock);
                        }}
                      >
                        <Trash2 size={15} />
                      </TooltipButton>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-slate-300">
            <div className="text-center">
              <AlertCircle size={42} className="mx-auto mb-3 text-slate-500" />
              <p className="text-sm font-semibold">No stocks match your filters</p>
              <p className="mt-1 text-xs text-slate-500">Adjust search, tabs, or filters to populate the terminal.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WatchlistTable;
