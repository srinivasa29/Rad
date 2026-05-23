import React, { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Zap,
  AlertTriangle,
  RefreshCw,
  Download,
  BarChart3,
  Activity,
  Flame,
  Bookmark,
  Save,
  Trash,
} from 'lucide-react';
import ScreenerFilterPanel from '../components/screener/ScreenerFilterPanel';
import ScreenerStockCard from '../components/screener/ScreenerStockCard';
import ScreenerResultsTable from '../components/screener/ScreenerResultsTable';
import HeatmapView from '../components/screener/HeatmapView';
import { toggleWatchlist } from '../api/api';
import './ScreenerPage.css';
import { runScreenerScan } from '../api/screenerApi';
import { useSocket } from '../hooks/useSocket';

const DEFAULT_FILTERS = {
  search: '',
  sector: 'All',
  signals: [],
  minPriceChange: 0,
  maxPriceChange: null,
  minRsi: 0,
  maxRsi: 100,
  minPrice: '',
  maxPrice: '',
  minVolume: '',
  showOnlySignals: true,
  trendType: 'all',
};

const MIN_LIVE_RESULTS = 10;
const MAX_SCREENER_RESULTS = 200;
const CLIENT_CACHE_TTL_MS = 30000;
const CLIENT_CACHE_KEY = 'radar_screener_cache_v4';

const ScreenerPage = () => {
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [activeSignalTab, setActiveSignalTab] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [actionNotice, setActionNotice] = useState('');
  const [coverageNote, setCoverageNote] = useState('');
  const [dataSource, setDataSource] = useState('live');
  const [activePreset, setActivePreset] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const inFlightRef = useRef(false);
  const deferredSearch = useDeferredValue(filters.search);
  const { isConnected: isRealtimeConnected, on, off, emit } = useSocket(['ticker']);
  const contentRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const [customScanners, setCustomScanners] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('radar_custom_scanners') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [addingWatchlist, setAddingWatchlist] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');

  const handleSaveScanner = () => {
    const name = prompt('Enter a name for your custom scanner:');
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;
    const duplicate = customScanners.find(s => s.name.toLowerCase() === cleanName.toLowerCase());
    if (duplicate) {
      alert('A scanner with this name already exists.');
      return;
    }
    const next = [...customScanners, { id: Date.now(), name: cleanName, filters }];
    setCustomScanners(next);
    localStorage.setItem('radar_custom_scanners', JSON.stringify(next));
    pushNotice(`Scanner "${cleanName}" saved successfully.`);
  };

  const handleLoadCustomScanner = (scanner) => {
    setFilters(scanner.filters);
    pushNotice(`Applied Custom Scanner: ${scanner.name}`);
  };

  const handleDeleteScanner = (id, e) => {
    e.stopPropagation();
    const next = customScanners.filter(s => s.id !== id);
    setCustomScanners(next);
    localStorage.setItem('radar_custom_scanners', JSON.stringify(next));
    pushNotice('Custom scanner deleted.');
  };

  const handleAddSelectedToWatchlist = async () => {
    if (selectedStocks.length === 0) return;
    setAddingWatchlist(true);
    let count = 0;
    try {
      const symbolsToToggle = stocks
        .filter(s => selectedStocks.includes(s.id))
        .map(s => s.symbol);
      const mode = String(localStorage.getItem('mode') || 'investor').toLowerCase();
      const targetName = mode === 'investor' ? 'Investor Portfolio' : 'Research Watchlist';
      for (const symbol of symbolsToToggle) {
        await toggleWatchlist(symbol, mode);
        count++;
      }
      pushNotice(`Successfully toggled ${count} stocks in ${targetName}.`);
      setSelectedStocks([]);
    } catch (err) {
      pushNotice(`Failed to update watchlist: ${err.message}`);
    } finally {
      setAddingWatchlist(false);
    }
  };

  const QUICK_PRESETS = [
    {
      id: 'momentum-surge',
      label: 'Momentum Surge',
      filters: { minRsi: 55, minPriceChange: 0.8, signals: ['BULLISH'], trendType: 'bullish' },
      tab: 'bullish',
    },
    {
      id: 'breakout-rvol',
      label: 'Breakout + Volume',
      filters: { minPriceChange: 1.2, minVolume: 2500000, signals: ['BULLISH'], trendType: 'bullish' },
      tab: 'bullish',
    },
    {
      id: 'pullback-rebound',
      label: 'Pullback Rebound',
      filters: { maxRsi: 55, minPriceChange: -5, maxPriceChange: 0, signals: ['BEARISH'], trendType: 'bearish' },
      tab: 'bearish',
    },
    {
      id: 'oversold-watch',
      label: 'Oversold Watch',
      filters: { maxRsi: 35, signals: ['BEARISH'], trendType: 'bearish' },
      tab: 'bearish',
    },
  ];

  const MOCK_STOCKS = [
    {
      id: 1,
      symbol: 'INFY',
      name: 'Infosys',
      price: 1556.15,
      change: 2.21,
      changePercent: 2.21,
      volume: 8500000,
      sector: 'IT',
      signal: 'BREAKOUT',
      signalStrength: 'Strong',
      signalType: 'SMA, EMA, GO',
      rsi: 55,
      pe: 25.3,
      trend: 'bullish',
      sentiment: 65,
      strength: 'Confidence 85%',
      entry: 1548.2,
      target: 1602.6,
      stopLoss: 1528.9,
      rvol: 2.1,
      timeframe: '5m',
      chart: [1500, 1510, 1505, 1520, 1535, 1540, 1545, 1550, 1556],
    },
    {
      id: 2,
      symbol: 'HDFCBANK',
      name: 'HDFC Bank',
      price: 1689.20,
      change: 1.48,
      changePercent: 1.48,
      volume: 7600000,
      sector: 'Banking',
      signal: 'MOMENTUM',
      signalStrength: 'Strong',
      signalType: 'MACD bullish crossover',
      rsi: 65,
      pe: 22.1,
      trend: 'bullish',
      sentiment: 72,
      strength: 'Confidence 78%',
      entry: 1680.4,
      target: 1725.8,
      stopLoss: 1662.7,
      rvol: 1.8,
      timeframe: '5m',
      chart: [1650, 1660, 1670, 1675, 1680, 1685, 1687, 1689],
    },
    {
      id: 3,
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      price: 3627.55,
      change: 1.16,
      changePercent: 1.16,
      volume: 3100000,
      sector: 'IT',
      signal: 'MOMENTUM',
      signalStrength: 'Strong',
      signalType: 'Momentum building with MACD crossover',
      rsi: 68,
      pe: 28.5,
      trend: 'bullish',
      sentiment: 68,
      strength: 'Confidence 82%',
      entry: 3605.2,
      target: 3715.6,
      stopLoss: 3558.4,
      rvol: 1.6,
      timeframe: '1D',
      chart: [3500, 3520, 3540, 3580, 3600, 3615, 3620, 3628],
    },
    {
      id: 4,
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      price: 2845.00,
      change: 1.40,
      changePercent: 1.40,
      volume: 9900000,
      sector: 'Energy',
      signal: 'BREAKOUT',
      signalStrength: 'Strong',
      signalType: 'Range breakout, +2% volume',
      rsi: 58,
      pe: 20.2,
      trend: 'bullish',
      sentiment: 75,
      strength: 'Confidence 88%',
      entry: 2830.4,
      target: 2898.1,
      stopLoss: 2796.2,
      rvol: 2.3,
      timeframe: '5m',
      chart: [2800, 2810, 2820, 2830, 2835, 2840, 2843, 2845],
    },
    {
      id: 5,
      symbol: 'KOTANBANK',
      name: 'Kotak Mahindra Bank',
      price: 1850.50,
      change: -4.70,
      changePercent: -4.70,
      volume: 2200000,
      sector: 'Banking',
      signal: 'PULLBACK',
      signalStrength: 'Medium',
      signalType: 'Pullback rebounding with strong volume shock',
      rsi: 42,
      pe: 19.8,
      trend: 'bearish',
      sentiment: -35,
      strength: 'Confidence 64%',
      entry: 1862.2,
      target: 1910.4,
      stopLoss: 1822.6,
      rvol: 1.4,
      timeframe: '1D',
      chart: [1950, 1930, 1910, 1890, 1870, 1860, 1855, 1850],
    },
    {
      id: 6,
      symbol: 'SBIN',
      name: 'State Bank of India',
      price: 826.50,
      change: -1.55,
      changePercent: -1.55,
      volume: 11200000,
      sector: 'Banking',
      signal: 'MOMENTUM',
      signalStrength: 'Medium',
      signalType: 'MACD showing weakness',
      rsi: 35,
      pe: 18.4,
      trend: 'bearish',
      sentiment: -45,
      strength: 'Confidence 61%',
      entry: 832.6,
      target: 856.2,
      stopLoss: 812.4,
      rvol: 1.9,
      timeframe: '1D',
      chart: [840, 835, 833, 831, 830, 829, 828, 826],
    },
    {
      id: 7,
      symbol: 'BAJAJ AUTO',
      name: 'Bajaj Auto',
      price: 9250.75,
      change: 3.21,
      changePercent: 3.21,
      volume: 1800000,
      sector: 'Auto',
      signal: 'BREAKOUT',
      signalStrength: 'Strong',
      signalType: 'Range Breakout',
      rsi: 72,
      pe: 24.6,
      trend: 'bullish',
      sentiment: 82,
      strength: 'Confidence 91%',
      entry: 9202.4,
      target: 9495.8,
      stopLoss: 9068.3,
      rvol: 2.6,
      timeframe: '5m',
      chart: [8900, 8950, 9000, 9100, 9150, 9200, 9230, 9251],
    },
    {
      id: 8,
      symbol: 'ITC',
      name: 'ITC Limited',
      price: 468.25,
      change: 0.54,
      changePercent: 0.54,
      volume: 8400000,
      sector: 'FMCG',
      signal: 'MOMENTUM',
      signalStrength: 'Low',
      signalType: 'Consolidation zone',
      rsi: 48,
      pe: 21.3,
      trend: 'neutral',
      sentiment: 12,
      strength: 'Confidence 53%',
      entry: 465.8,
      target: 478.4,
      stopLoss: 458.3,
      rvol: 1.2,
      timeframe: '1D',
      chart: [460, 462, 464, 466, 467, 467, 468, 468],
    },
  ];

  // Live load on mount — replaces MOCK_STOCKS
  const fetchAndSet = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      setCoverageNote('');
      
      // Map active frontend filters state to backend schema
      const backendFilters = {};
      if (filters.minPrice !== '') backendFilters.minPrice = parseFloat(filters.minPrice);
      if (filters.maxPrice !== '') backendFilters.maxPrice = parseFloat(filters.maxPrice);
      if (filters.minPriceChange !== null && filters.minPriceChange !== '') backendFilters.minChange = parseFloat(filters.minPriceChange);
      if (filters.maxPriceChange !== null && filters.maxPriceChange !== '') backendFilters.maxChange = parseFloat(filters.maxPriceChange);
      if (filters.minRsi !== undefined) backendFilters.minRsi = Number(filters.minRsi);
      if (filters.maxRsi !== undefined) backendFilters.maxRsi = Number(filters.maxRsi);
      
      if (filters.sector && filters.sector !== 'All') {
        backendFilters.sectors = [filters.sector];
      }

      if (filters.emaCrossover && filters.emaCrossover !== 'all') backendFilters.emaCrossover = filters.emaCrossover;
      if (filters.smaCrossover && filters.smaCrossover !== 'all') backendFilters.smaCrossover = filters.smaCrossover;
      if (filters.bollingerSqueeze !== undefined && filters.bollingerSqueeze !== null && filters.bollingerSqueeze !== '') {
        backendFilters.bollingerSqueeze = String(filters.bollingerSqueeze);
      }
      if (filters.breakoutType && filters.breakoutType !== 'all') backendFilters.breakoutType = filters.breakoutType;
      if (filters.candlestickPattern && filters.candlestickPattern !== 'all') backendFilters.candlestickPattern = filters.candlestickPattern;
      if (filters.trendStrength && filters.trendStrength !== 'all') backendFilters.trendStrength = filters.trendStrength;
      if (filters.minRiskReward !== undefined && filters.minRiskReward !== null && filters.minRiskReward !== '') {
        backendFilters.minRiskReward = parseFloat(filters.minRiskReward);
      }

      const res = await runScreenerScan({
        limit: MAX_SCREENER_RESULTS,
        strictLive: false,
        includeIndicators: showAdvanced,
        filters: backendFilters,
        timeframe: timeframe,
      });
      // Backend wraps: { success, data: { results: [...] } }
      const inner = res?.data ?? res;
      const payload = inner?.data ?? inner;
      const raw = payload?.results ?? payload?.stocks ?? (Array.isArray(payload) ? payload : []);
      const returnedCount = Number(payload?.returned ?? raw.length ?? 0);
      
      const normalized = raw.map((s, i) => ({
        id: s._id || s.id || s.displaySymbol || s.symbol || i,
        symbol: String(s.displaySymbol || s.symbol || '').replace(/\.(NS|BO)$/i, ''),
        name: s.name || s.displaySymbol || s.symbol || '',
        price: Number(s.price ?? 0),
        change: Number(s.changePercent ?? s.change ?? 0),
        volume: Number(s.volume ?? 0),
        sector: s.sector || 'Equity',
        signal: String(s.signal || s.bias || 'NEUTRAL').toUpperCase(),
        bias: String(s.bias || 'neutral').toLowerCase(),
        rsi: Number.isFinite(Number(s.rsi)) ? Number(s.rsi) : null,
        ema20: Number.isFinite(Number(s.ema20)) ? Number(s.ema20) : null,
        ema50: Number.isFinite(Number(s.ema50)) ? Number(s.ema50) : null,
        ema200: Number.isFinite(Number(s.ema200)) ? Number(s.ema200) : null,
        sma50: Number.isFinite(Number(s.sma50)) ? Number(s.sma50) : null,
        sma200: Number.isFinite(Number(s.sma200)) ? Number(s.sma200) : null,
        atr: Number.isFinite(Number(s.atr)) ? Number(s.atr) : null,
        support: Number.isFinite(Number(s.support)) ? Number(s.support) : null,
        resistance: Number.isFinite(Number(s.resistance)) ? Number(s.resistance) : null,
        bollinger: s.bollinger || null,
        pe: Number.isFinite(Number(s.pe)) ? Number(s.pe) : null,
        score: Number.isFinite(Number(s.score)) ? Number(s.score) : null,
        confidence: Number.isFinite(Number(s.confidence)) ? Number(s.confidence) : null,
        volumeStatus: s.volumeStatus || null,
        why: s.why || '',
        marketCap: s.marketCap || null,
        emaCrossover: s.emaCrossover || 'neutral',
        smaCrossover: s.smaCrossover || 'neutral',
        bollingerSqueeze: s.bollingerSqueeze ?? false,
        breakoutType: s.breakoutType || 'none',
        riskRewardRatio: Number.isFinite(Number(s.riskRewardRatio)) ? Number(s.riskRewardRatio) : 1.5,
        trendStrength: s.trendStrength || 'moderate',
        candlestickPattern: s.candlestickPattern || 'none',
      }));

      // Use backend results only; no mock fallback for trader screener
      if (normalized.length > 0) {
        setStocks(normalized);
        setDataSource('live');
        if (normalized.length < MIN_LIVE_RESULTS || returnedCount < MAX_SCREENER_RESULTS) {
          setCoverageNote(`Limited API coverage: ${returnedCount} of ${MAX_SCREENER_RESULTS} stocks returned.`);
        }
        try {
          localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            results: normalized,
            returned: returnedCount,
          }));
        } catch (_err) {}
      } else {
        setStocks([]);
        setDataSource('unavailable');
        setCoverageNote('Live APIs returned no stocks.');
      }
    } catch (err) {
      console.warn('ScreenerPage load failed, using demo data:', err.message);
      setStocks([]);
      setDataSource('unavailable');
      setCoverageNote('Live APIs unavailable. Please retry.');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [showAdvanced, filters, timeframe]);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CLIENT_CACHE_KEY) || 'null');
      if (cached?.ts && Array.isArray(cached.results)) {
        const age = Date.now() - cached.ts;
        if (age <= CLIENT_CACHE_TTL_MS) {
          setStocks(cached.results);
          setDataSource('cached');
          setCoverageNote(`Cached data (${Math.round(age / 1000)}s ago). Refreshing...`);
        }
      }
    } catch (_err) {}

    fetchAndSet();
  }, [fetchAndSet]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const filteredStocks = useMemo(() => {
    let result = stocks;
    const search = deferredSearch.trim().toLowerCase();

    if (search) {
      result = result.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(search) ||
          stock.name.toLowerCase().includes(search)
      );
    }

    if (filters.sector !== 'All') {
      result = result.filter((stock) => stock.sector === filters.sector);
    }

    if (filters.signals.length > 0) {
      result = result.filter((stock) =>
        filters.signals.includes(String(stock.signal || stock.bias || '').toUpperCase())
      );
    }

    if (filters.minPriceChange !== null) {
      result = result.filter((stock) => stock.change >= filters.minPriceChange);
    }
    if (filters.maxPriceChange !== null) {
      result = result.filter((stock) => stock.change <= filters.maxPriceChange);
    }

    result = result.filter((stock) => {
      const rsi = Number(stock.rsi);
      if (!Number.isFinite(rsi)) {
        return filters.minRsi <= 0 && filters.maxRsi >= 100;
      }
      return rsi >= filters.minRsi && rsi <= filters.maxRsi;
    });

    if (filters.minPrice) {
      result = result.filter((stock) => stock.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter((stock) => stock.price <= parseFloat(filters.maxPrice));
    }

    if (filters.minVolume) {
      result = result.filter((stock) => stock.volume >= parseFloat(filters.minVolume));
    }

    if (filters.trendType !== 'all') {
      result = result.filter((stock) => String(stock.bias || 'neutral') === filters.trendType);
    }

    if (filters.showOnlySignals && activeSignalTab !== 'all') {
      result = result.filter((stock) => String(stock.bias || 'neutral') === activeSignalTab.toLowerCase());
    }

    // Advanced Trader Filters
    if (filters.breakoutType && filters.breakoutType !== 'all') {
      result = result.filter((stock) => stock.breakoutType === filters.breakoutType);
    }

    if (filters.emaCrossover && filters.emaCrossover !== 'all') {
      result = result.filter((stock) => stock.emaCrossover === filters.emaCrossover);
    }

    if (filters.smaCrossover && filters.smaCrossover !== 'all') {
      result = result.filter((stock) => stock.smaCrossover === filters.smaCrossover);
    }

    if (filters.bollingerSqueeze !== undefined && filters.bollingerSqueeze !== null && filters.bollingerSqueeze !== '') {
      const expected = String(filters.bollingerSqueeze) === 'true';
      result = result.filter((stock) => stock.bollingerSqueeze === expected);
    }

    if (filters.candlestickPattern && filters.candlestickPattern !== 'all') {
      result = result.filter((stock) => stock.candlestickPattern === filters.candlestickPattern);
    }

    if (filters.trendStrength && filters.trendStrength !== 'all') {
      result = result.filter((stock) => stock.trendStrength === filters.trendStrength);
    }

    if (filters.minRiskReward !== undefined && filters.minRiskReward !== null && filters.minRiskReward !== '') {
      result = result.filter((stock) => stock.riskRewardRatio >= parseFloat(filters.minRiskReward));
    }

    return result;
  }, [stocks, filters, activeSignalTab, deferredSearch]);
  const normalizeSocketSymbol = (value) => String(value || '')
    .toUpperCase()
    .replace(/^NSE:/, '')
    .replace(/\.(NS|BO)$/i, '')
    .trim();

  useEffect(() => {
    if (!emit || stocks.length === 0) return;
    const symbols = stocks.map((stock) => stock.symbol).filter(Boolean).slice(0, 50);
    emit('subscribe', { channels: ['ticker'], symbols });
    return () => emit('unsubscribe', { channels: ['ticker'], symbols });
  }, [emit, stocks]);

  useEffect(() => {
    if (!on) return;
    const handler = (event) => {
      if (!event || event.type === 'indices') return;
      const symbol = normalizeSocketSymbol(event.symbol);
      if (!symbol) return;

      setStocks((prev) => prev.map((stock) => {
        if (stock.symbol !== symbol) return stock;
        const nextPrice = Number(event.price);
        if (!Number.isFinite(nextPrice)) return stock;
        const prevPrice = Number(stock.price);
        const change = Number.isFinite(event.change)
          ? Number(event.change)
          : (Number.isFinite(prevPrice) && prevPrice > 0 ? ((nextPrice - prevPrice) / prevPrice) * 100 : stock.change);
        return {
          ...stock,
          price: nextPrice,
          change: Number.isFinite(change) ? Number(change.toFixed(2)) : stock.change,
        };
      }));
      setLastUpdated(new Date());
    };

    on('price_update', handler);
    return () => off?.('price_update', handler);
  }, [on, off]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setActiveSignalTab('all');
    setActivePreset('');
    pushNotice('Filters reset to default.');
  };

  const applyPreset = (preset) => {
    const next = { ...filters, ...preset.filters };
    if (preset.filters.signals) next.signals = preset.filters.signals;
    setFilters(next);
    setActiveSignalTab(preset.tab || 'all');
    setActivePreset(preset.id);
    pushNotice(`Preset applied: ${preset.label}.`);
  };

  const pushNotice = (text) => {
    setActionNotice(text);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => setActionNotice(''), 2400);
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchAndSet();
      setLastUpdated(new Date());
      pushNotice('Scanner refreshed with live data.');
    } finally {
      setLoading(false);
    }
  }, [fetchAndSet]);

  const toggleStockSelection = (stockId) => {
    setSelectedStocks((prev) =>
      prev.includes(stockId) ? prev.filter((id) => id !== stockId) : [...prev, stockId]
    );
  };

  const openResearch = (symbol) => {
    navigate(`/stocks/${encodeURIComponent(symbol)}`);
  };

  const handleExport = () => {
    if (!filteredStocks.length) {
      pushNotice('No results to export.');
      return;
    }

    const data = filteredStocks
      .map((stock) => ({
        Symbol: stock.symbol,
        Name: stock.name,
        Price: stock.price,
        Change: stock.change,
        RSI: stock.rsi,
        Signal: stock.signal,
        Sector: stock.sector,
      }))
      .sort((a, b) => parseFloat(b.Change) - parseFloat(a.Change));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screener-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    pushNotice('Excel export completed.');
  };

  const SIGNAL_TABS = useMemo(() => ([
    { id: 'all', label: 'All Signals', count: filteredStocks.length },
    { id: 'bullish', label: 'Bullish', count: filteredStocks.filter((s) => s.bias === 'bullish').length },
    { id: 'neutral', label: 'Neutral', count: filteredStocks.filter((s) => s.bias === 'neutral').length },
    { id: 'bearish', label: 'Bearish', count: filteredStocks.filter((s) => s.bias === 'bearish').length },
  ]), [filteredStocks]);
  const scansActive = Math.max(12, filteredStocks.length * 8 + 2);

  const SECTOR_OPTIONS = useMemo(() => ['All', ...new Set(stocks.map((s) => s.sector).filter(Boolean))], [stocks]);

  return (
    <div className="screener-page screener-shell h-screen flex overflow-hidden">
      {}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-80 screener-sidepanel border-r border-slate-700 overflow-y-auto"
          >
            <ScreenerFilterPanel
              sectors={SECTOR_OPTIONS}
              filters={filters}
              onFilterChange={handleFilterChange}
              onActivateScan={handleRefresh}
              onClose={() => setFilterOpen(false)}
              defaultFilters={DEFAULT_FILTERS}
              onReset={resetFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="flex-1 flex flex-col overflow-hidden">
        {}
        <div className="screener-header border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!filterOpen && (
              <button
                onClick={() => setFilterOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 text-slate-300" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-cyan-400" />
                Screener Dashboard
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Discover actionable market opportunities with research-first scans.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`screener-pill ${dataSource === 'unavailable' ? 'screener-pill--warn' : 'screener-pill--ok'}`}>
                  {dataSource === 'unavailable' ? 'Live Feed Unavailable' : dataSource === 'cached' ? 'Cached Feed' : 'Live Feed'}
                </span>
                <span className={`screener-pill ${isRealtimeConnected ? 'screener-pill--ok' : 'screener-pill--neutral'}`}>
                  {isRealtimeConnected ? 'Realtime On' : 'Realtime Off'}
                </span>
                <span className="screener-pill screener-pill--neutral">Universe {stocks.length}</span>
                <span className="screener-pill screener-pill--neutral">Signals {filteredStocks.length}</span>
                {coverageNote && (
                  <span className="screener-pill screener-pill--warn">{coverageNote}</span>
                )}
              </div>
            </div>
          </div>

            <div className="screener-actionbar flex flex-wrap items-center gap-2">
            {selectedStocks.length > 0 && (
              <button
                onClick={handleAddSelectedToWatchlist}
                disabled={addingWatchlist}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 transition-colors flex items-center gap-2 text-sm font-semibold"
              >
                <Bookmark className="w-4.5 h-4.5" />
                Add to Watchlist ({selectedStocks.length})
              </button>
            )}



            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2">TF</span>
              {['15M', '1H', '4H', '1D'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => { setTimeframe(tf); pushNotice(`Switched timeframe context to ${tf}`); }}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>

            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Table View"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-2 rounded transition-colors ${
                  viewMode === 'heatmap'
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Heatmap View"
              >
                <Flame className="w-4 h-4" />
              </button>
            </div>
              <button
                onClick={() => setShowAdvanced((prev) => !prev)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  showAdvanced
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                Advanced
              </button>
          </div>
        </div>

        {}
        <div className="h-16 border-b border-slate-700/50 px-6 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 overflow-x-auto">
          {SIGNAL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSignalTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
                activeSignalTab === tab.id
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeSignalTab === tab.id ? 'bg-cyan-500/40' : 'bg-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-amber-300 whitespace-nowrap">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold">{scansActive} Scans Active</span>
          </div>
        </div>

        <div className="screener-quickbar px-6 py-3 border-b border-slate-700/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="screener-quick-label">Quick Scans</span>
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`screener-quick-chip ${activePreset === preset.id ? 'active' : ''}`}
              >
                {preset.label}
              </button>
            ))}

            {customScanners.length > 0 && (
              <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                <span className="screener-quick-label">Custom Scanners</span>
                {customScanners.map((scanner) => (
                  <div key={scanner.id} className="relative group/scanner inline-flex items-center">
                    <button
                      onClick={() => handleLoadCustomScanner(scanner)}
                      className="screener-quick-chip active:scale-95"
                    >
                      {scanner.name}
                    </button>
                    <button
                      onClick={(e) => handleDeleteScanner(scanner.id, e)}
                      className="absolute -top-1 -right-1 hidden group-hover/scanner:flex w-4.5 h-4.5 rounded-full bg-rose-600 hover:bg-rose-500 items-center justify-center text-[10px] text-white font-bold"
                      title="Delete scanner"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={resetFilters}
            className="screener-quick-reset"
          >
            Reset Filters
          </button>
        </div>

        {}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="mb-4"
                >
                  <Zap className="w-12 h-12 text-cyan-400" />
                </motion.div>
                <p className="text-slate-400">Scanning market universe...</p>
              </motion.div>
            ) : filteredStocks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <AlertTriangle className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-slate-400 text-lg">No stocks match your filters</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your search criteria</p>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredStocks.map((stock, index) => (
                  <ScreenerStockCard
                    key={stock.id}
                    stock={stock}
                    isSelected={selectedStocks.includes(stock.id)}
                    onSelect={() => toggleStockSelection(stock.id)}
                    onOpenResearch={openResearch}
                    showAdvanced={showAdvanced}
                    index={index}
                  />
                ))}
              </motion.div>
            ) : viewMode === 'heatmap' ? (
              <motion.div
                key="heatmap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HeatmapView
                  stocks={filteredStocks}
                  onOpenResearch={openResearch}
                />
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ScreenerResultsTable
                  stocks={filteredStocks}
                  onOpenResearch={openResearch}
                  showAdvanced={showAdvanced}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {}
          {!loading && filteredStocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50"
            >
              <p className="text-sm text-slate-400">
                Showing <span className="text-cyan-300 font-semibold">{filteredStocks.length}</span> results
                {filters.search && ` for "${filters.search}"`}
              </p>
            </motion.div>
          )}

          {actionNotice && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100"
            >
              {actionNotice}
            </motion.div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Last Updated: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}</span>
            <span>Data provided by Market Terminal 2.0.4 | prices delayed by 16 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenerPage;
