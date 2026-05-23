import React, { useState } from 'react';
import { 
    Filter, 
    Star, 
    TrendingUp, 
    Users, 
    Activity, 
    BarChart3, 
    Banknote, 
    ShieldCheck, 
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Search,
    SlidersHorizontal,
    Plus,
    X,
    Info,
    Check,
    ArrowUpRight,
    Zap,
    RefreshCw,
    Trash2,
    Download
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { runScreenerScan, createCustomFilter, getCustomFilters, deleteCustomFilter } from '../../api/screenerApi';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api, { toggleWatchlist as apiToggleWatchlist } from '../../api/api';

const MOCK_READY_MADE = [
    { id: 'div', title: 'Dividend Giants', desc: 'Top yield names with stable cash flows and 5Y growth.', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', filters: { yield: '> 1%', mcap: 'Large' } },
    { id: 'it', title: 'IT Breakouts', desc: 'Volume leaders in tech with RSI momentum signals.', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', filters: { sector: 'IT' } },
    { id: 'value', title: 'Deep Value Gems', desc: 'Lowest P/E stocks with positive earnings surprises.', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', filters: { pe: 'Low (<15)' } },
    { id: 'bluechip', title: 'Bluechip Titans', desc: 'Most reliable large cap institutions with steady growth.', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', filters: { mcap: 'Large' } }
];

const MOCK_FALLBACK_RESULTS = [
    { 
        id: 'HDFCBANK.NS', price: '₹1,652', change: '+0.4%', isPositive: true, sector: 'Finance', mcap: '12.5T', pe: '18.2', roe: '16.5%', yield: '1.2%', confidence: 92,
        why: 'Price testing major demand zone with high institutional delivery.', 
        tags: ['Value', 'Large Cap'], trend: [1640, 1645, 1642, 1650, 1648, 1652]
    },
    { 
        id: 'RELIANCE.NS', price: '₹2,985', change: '+1.1%', isPositive: true, sector: 'Energy', mcap: '20.1T', pe: '24.5', roe: '14.2%', yield: '0.8%', confidence: 85,
        why: 'Breakout above 20-day EMA on increased relative volume.', 
        tags: ['Momentum', 'Bluechip'], trend: [2950, 2960, 2975, 2980, 2970, 2985]
    }
];

const strategies = [
    { id: 'intra', label: 'Intraday Volatility', desc: 'High momentum stocks for quick trades', icon: Activity, color: 'text-emerald-500', filters: { change: '> 2%', volume: 'High' } },
    { id: 'lowrisk', label: 'Low Risk Portfolio', desc: 'Stable, low beta picks for steady gains', icon: ShieldCheck, color: 'text-blue-500', filters: { beta: '< 0.8', yield: '> 2%' } },
    { id: 'dip', label: 'Buy the Dip', desc: 'Oversold bounces at critical support', icon: TrendingUp, color: 'text-amber-500', filters: { change: '< -3%', rsi: 'Oversold' } },
    { id: 'breakout', label: 'Breakouts', desc: 'Riding the wave of volume breakouts', icon: ArrowUpRight, color: 'text-purple-500', filters: { change: '> 1.5%', volume: 'Very High' } },
    { id: 'gappers', label: 'Volume Gappers', desc: 'Stocks with significant pre-market volume gaps', icon: Zap, color: 'text-orange-500', filters: { volume: 'Extreme', change: '> 3%' } },
    { id: 'orb', label: 'Opening Range Breakout', desc: 'Strategic filters for the first 15m breakout', icon: Activity, color: 'text-pink-500', filters: { change: '> 1%', volume: 'High' } },
    { id: 'reversal', label: 'Mean Reversion', desc: 'Statistical pullbacks to critical moving averages', icon: TrendingUp, color: 'text-teal-500', filters: { rsi: 'Neutral', change: '< 0%' } },
];

const allFilters = [
    { id: 'mcap', label: 'Market Cap', icon: BarChart3, options: ['Large', 'Mid', 'Small', 'Micro'] },
    { id: 'price', label: 'Price', icon: Banknote, options: ['Any', '< ₹500', '₹500 - ₹2k', '> ₹2k'] },
    { id: 'change', label: 'Change %', icon: TrendingUp, options: ['Any', '> 0%', '> 2%', '> 5%', '< 0%'] },
    { id: 'sector', label: 'Sector', icon: Search, options: ['All', 'IT', 'Finance', 'FMCG', 'Auto', 'Energy', 'Healthcare'] },
    { id: 'roe', label: 'ROE', icon: Activity, options: ['Any', '> 10%', '> 15%', '> 20%'] },
    { id: 'pe', label: 'P/E', icon: Filter, options: ['Any', 'Low (<15)', 'Medium', 'High'] },
    { id: 'yield', label: 'Div. Yield', icon: Banknote, options: ['Any', '> 1%', '> 2%', '> 3%'] },
    { id: 'volume', label: 'Volume', icon: Activity, options: ['Any', 'Low', 'Normal', 'High', 'Very High'] },
    { id: 'rsi', label: 'RSI', icon: BarChart3, options: ['Any', 'Oversold (<30)', 'Neutral', 'Overbought (>70)'] },
    { id: 'beta', label: 'Beta', icon: ShieldCheck, options: ['Any', '< 0.8', '0.8 - 1.2', '> 1.2'] },
    { id: 'debt', label: 'Debt/Eq', icon: Filter, options: ['Low (<0.5)', 'Moderate', 'High'] },
    { id: 'eps', label: 'EPS Growth', icon: TrendingUp, options: ['Any', '> 5%', '> 15%', '> 25%'] },
    { id: 'range', label: '52W Range', icon: SlidersHorizontal, options: ['Any', 'Near High', 'Near Low', 'Midway'] },
    { id: 'inst', label: 'Inst. Holding', icon: Users, options: ['Any', '> 50%', '> 70%', 'Increasing'] },
    { id: 'margin', label: 'Profit Margin', icon: Activity, options: ['Any', '> 10%', '> 20%', '> 30%'] },
    { id: 'peg', label: 'PEG Ratio', icon: Filter, options: ['Any', '< 1 (Cheap)', '1 - 2', '> 2'] },
    { id: 'pb', label: 'Price/Book', icon: Banknote, options: ['Any', '< 1', '< 3', '> 5'] },
];


// ── Translate human-readable UI filter values → backend numeric format ──────
const translateFilters = (uiFilters) => {
    const out = {};

    // Change %
    const changeMap = { '> 0%': { minChange: 0 }, '> 2%': { minChange: 2 }, '> 5%': { minChange: 5 }, '< 0%': { maxChange: -0.01 } };
    if (uiFilters.change && changeMap[uiFilters.change]) Object.assign(out, changeMap[uiFilters.change]);

    // P/E
    const peMap = { 'Low (<15)': { maxPe: 15 }, 'Medium': { minPe: 15, maxPe: 30 }, 'High': { minPe: 30 } };
    if (uiFilters.pe && peMap[uiFilters.pe]) Object.assign(out, peMap[uiFilters.pe]);

    // Price
    const priceMap = { '< ₹500': { maxPrice: 500 }, '₹500 - ₹2k': { minPrice: 500, maxPrice: 2000 }, '> ₹2k': { minPrice: 2000 } };
    if (uiFilters.price && priceMap[uiFilters.price]) Object.assign(out, priceMap[uiFilters.price]);

    // Market Cap (in INR)
    const mcapMap = { 'Large': { minMarketCap: 200_000_000_000 }, 'Mid': { minMarketCap: 20_000_000_000, maxMarketCap: 200_000_000_000 }, 'Small': { minMarketCap: 1_000_000_000, maxMarketCap: 20_000_000_000 }, 'Micro': { maxMarketCap: 1_000_000_000 } };
    if (uiFilters.mcap && mcapMap[uiFilters.mcap]) Object.assign(out, mcapMap[uiFilters.mcap]);

    // Sector
    if (uiFilters.sector && uiFilters.sector !== 'All') out.sectors = [uiFilters.sector];

    // ROE (minChange uses score as proxy here; ROE isn't in backend directly)
    const roeMap = { '> 10%': { minScore: 50 }, '> 15%': { minScore: 60 }, '> 20%': { minScore: 70 } };
    if (uiFilters.roe && roeMap[uiFilters.roe]) Object.assign(out, roeMap[uiFilters.roe]);

    // RSI
    const rsiMap = { 'Oversold (<30)': { maxRsi: 30 }, 'Neutral': { minRsi: 40, maxRsi: 60 }, 'Overbought (>70)': { minRsi: 70 } };
    if (uiFilters.rsi && rsiMap[uiFilters.rsi]) Object.assign(out, rsiMap[uiFilters.rsi]);

    // Strategy-level quick signals (already in numeric form)
    if (uiFilters.minChange !== undefined) out.minChange = uiFilters.minChange;
    if (uiFilters.maxChange !== undefined) out.maxChange = uiFilters.maxChange;
    if (uiFilters.minRsi !== undefined) out.minRsi = uiFilters.minRsi;
    if (uiFilters.maxRsi !== undefined) out.maxRsi = uiFilters.maxRsi;
    if (uiFilters.minScore !== undefined) out.minScore = uiFilters.minScore;
    if (uiFilters.volume) {
        const volMap = { 'High': 'high', 'Very High': 'very_high', 'Extreme': 'very_high', 'Low': 'low', 'Normal': 'normal' };
        out.volumeStatus = volMap[uiFilters.volume] || uiFilters.volume.toLowerCase();
    }

    return out;
};


const Screeners = ({ isHero = false, initialFilters = {} }) => {
    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const [visibleFilters, setVisibleFilters] = useState(['mcap', 'price', 'change', 'sector', 'roe', 'pe']);
    const [activeStrategy, setActiveStrategy] = useState(null);
    const [openFilter, setOpenFilter] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSignalModal, setShowSignalModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState(() => {
        const cached = localStorage.getItem('radar_screener_results');
        return cached ? JSON.parse(cached) : MOCK_FALLBACK_RESULTS;
    });
    const hasActiveFilters = Object.keys(activeFilters || {}).some(k => 
        activeFilters[k] !== undefined && 
        activeFilters[k] !== null && 
        activeFilters[k] !== '' && 
        activeFilters[k] !== 'Any'
    );
    const [readyMade, setReadyMade] = useState(MOCK_READY_MADE);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showMoreTrending, setShowMoreTrending] = useState(false);
    const ITEMS_PER_PAGE = 10;
    const navigate = useNavigate();
    const userMode = localStorage.getItem('mode') || 'INVESTOR';

    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeFilters, searchTerm]);

    const [watchlist, setWatchlist] = useState([]);
    const [watchlistId, setWatchlistId] = useState(null);

    React.useEffect(() => {
        const checkWatchlist = async () => {
            try {
                const res = await api.get('/watchlist', { params: { mode: 'investor' } });
                const lists = res.data || [];
                if (lists.length > 0) {
                    setWatchlistId(lists[0]._id);
                    const syms = (lists[0].items || []).map(s => String(s?.symbol || s).toUpperCase().replace(/\.(NS|BO)$/i, ''));
                    setWatchlist(syms);
                }
            } catch (_) {}
        };
        checkWatchlist();

        window.addEventListener('watchlist_updated', checkWatchlist);
        return () => window.removeEventListener('watchlist_updated', checkWatchlist);
    }, []);

    const toggleWatchlist = async (e, stockId) => {
        e.stopPropagation();
        const sym = (stockId || '').split('.')[0].toUpperCase();
        try {
            await apiToggleWatchlist(stockId, 'investor');
            setWatchlist(prev => {
                if (prev.includes(sym)) {
                    return prev.filter(s => s !== sym);
                } else {
                    return [...prev, sym];
                }
            });
            window.dispatchEvent(new Event('watchlist_updated'));
        } catch (err) {
            console.error("Watchlist toggle failed", err);
        }
    };

    const [myFilters, setMyFilters] = useState([]);
    const [newFilterName, setNewFilterName] = useState('');
    const [newFilterOptions, setNewFilterOptions] = useState('');
    const [newFilterQuery, setNewFilterQuery] = useState('SELECT * FROM market WHERE x > y');
    const [filterSaving, setFilterSaving] = useState(false);
    const [filterError, setFilterError] = useState('');

    const [showSaveScreenerModal, setShowSaveScreenerModal] = useState(false);
    const [newScreenerName, setNewScreenerName] = useState('');
    const [newScreenerPurpose, setNewScreenerPurpose] = useState('');
    const [savedScreeners, setSavedScreeners] = useState(() => {
        const cached = localStorage.getItem('radar_saved_screeners');
        return cached ? JSON.parse(cached) : [];
    });

    const handleSaveScreenerClick = () => {
        if (!hasActiveFilters) {
            alert('No filters selected. Please select at least one filter before saving.');
            return;
        }
        setShowSaveScreenerModal(true);
    };

    const handleConfirmSaveScreener = () => {
        if (!newScreenerName.trim() || !newScreenerPurpose.trim()) {
            alert('Please provide both name and purpose.');
            return;
        }
        const newScreener = {
            id: Date.now().toString(),
            name: newScreenerName.trim(),
            purpose: newScreenerPurpose.trim(),
            filters: { ...activeFilters }
        };
        const updatedScreeners = [newScreener, ...savedScreeners];
        setSavedScreeners(updatedScreeners);
        localStorage.setItem('radar_saved_screeners', JSON.stringify(updatedScreeners));
        setShowSaveScreenerModal(false);
        setNewScreenerName('');
        setNewScreenerPurpose('');
    };

    const handleDeleteSavedScreener = (e, id) => {
        e.stopPropagation();
        const updatedScreeners = savedScreeners.filter(s => s.id !== id);
        setSavedScreeners(updatedScreeners);
        localStorage.setItem('radar_saved_screeners', JSON.stringify(updatedScreeners));
    };

    const handleLoadSavedScreener = (screener) => {
        if (activeFilters.preset === screener.id) {
            setActiveFilters({});
        } else {
            setActiveFilters({ ...screener.filters, preset: screener.id });
        }
    };

    const handleFilterChange = (id, value) => {
        if (activeFilters[id] === value || value === 'Any') {
            const newFilters = { ...activeFilters };
            delete newFilters[id];
            setActiveFilters(newFilters);
        } else {
            setActiveFilters(prev => ({ ...prev, [id]: value }));
        }
        setOpenFilter(null);
        setActiveStrategy(null);
    };

    const handleStrategySelect = (strat) => {
        if (activeStrategy === strat.id) {
            setActiveStrategy(null);
            setShowSignalModal(null);
            setActiveFilters({});
        } else {
            setShowSignalModal(strat);
            setActiveStrategy(strat.id);
            setActiveFilters({ ...strat.filters });
        }
    };

    const addMoreFilter = (id) => {
        if (!visibleFilters.includes(id)) {
            setVisibleFilters(prev => [...prev, id]);
        }
        setOpenFilter(null);
    };

    const loadMyFilters = async () => {
        try {
            const res = await getCustomFilters();
            const filters = res?.data || [];
            setMyFilters(filters);
            filters.forEach(f => {
                if (!allFilters.find(af => af.id === f._id)) {
                    allFilters.push({
                        id: f._id,
                        label: f.name,
                        icon: Filter,
                        options: f.options,
                        isCustom: true,
                    });
                }
            });
        } catch (_) {}
    };

    const handleCreateFilter = async () => {
        setFilterError('');
        if (!newFilterName.trim()) {
            setFilterError('Please enter a filter name.');
            return;
        }
        try {
            setFilterSaving(true);
            const res = await createCustomFilter({
                name: newFilterName.trim(),
                options: newFilterOptions,
                logicQuery: newFilterQuery,
            });
            const created = res.data;
            setMyFilters(prev => [created, ...prev]);
            allFilters.push({
                id: created._id,
                label: created.name,
                icon: Filter,
                options: created.options,
                isCustom: true,
            });
            setVisibleFilters(prev => [...prev, created._id]);
            setNewFilterName('');
            setNewFilterOptions('');
            setNewFilterQuery('SELECT * FROM market WHERE x > y');
            setShowCreateModal(false);
        } catch (err) {
            setFilterError(err?.response?.data?.message || 'Failed to create filter.');
        } finally {
            setFilterSaving(false);
        }
    };

    const handleDeleteMyFilter = async (id) => {
        try {
            await deleteCustomFilter(id);
            setMyFilters(prev => prev.filter(f => f._id !== id));
            setVisibleFilters(prev => prev.filter(vid => vid !== id));
        } catch (_) {}
    };

    const filteredResults = results.filter(stock => {
        const stockId = stock.id || '';
        if (searchTerm && !stockId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const runScanWithFilters = async (filtersToUse) => {
        try {
            setIsLoading(true);
            const apiFilters = {};
            const filters = filtersToUse || activeFilters;
            
            if (filters.pe && filters.pe !== 'Any') {
                if (filters.pe.includes('Low')) apiFilters.maxPe = 15;
                if (filters.pe.includes('Medium')) { apiFilters.minPe = 15; apiFilters.maxPe = 30; }
                if (filters.pe.includes('High')) apiFilters.minPe = 30;
            }
            if (filters.roe && filters.roe !== 'Any') {
                if (filters.roe.includes('> 10%')) apiFilters.minRoe = 10;
                if (filters.roe.includes('> 15%')) apiFilters.minRoe = 15;
                if (filters.roe.includes('> 20%')) apiFilters.minRoe = 20;
            }
            if (filters.change && filters.change !== 'Any') {
                if (filters.change.includes('> 0%')) apiFilters.minChange = 0;
                if (filters.change.includes('> 2%')) apiFilters.minChange = 2;
                if (filters.change.includes('> 3%')) apiFilters.minChange = 3;
                if (filters.change.includes('> 5%')) apiFilters.minChange = 5;
                if (filters.change.includes('< 0%')) apiFilters.maxChange = 0;
                if (filters.change.includes('< -3%')) apiFilters.maxChange = -3;
            }
            if (filters.price && filters.price !== 'Any') {
                if (filters.price.includes('< ₹500')) apiFilters.maxPrice = 500;
                if (filters.price.includes('₹500 - ₹2k')) { apiFilters.minPrice = 500; apiFilters.maxPrice = 2000; }
                if (filters.price.includes('> ₹2k')) apiFilters.minPrice = 2000;
            }
            if (filters.sector && filters.sector !== 'All') {
                const sectorMap = {
                    'IT': ['Information Technology', 'Technology', 'IT'],
                    'Finance': ['Financial Services', 'Finance'],
                    'FMCG': ['Consumer Defensive', 'FMCG'],
                    'Auto': ['Consumer Cyclical', 'Auto'],
                    'Energy': ['Energy', 'Utilities'],
                    'Healthcare': ['Healthcare']
                };
                apiFilters.sectors = sectorMap[filters.sector] || [filters.sector];
            }
            if (filters.rsi && filters.rsi !== 'Any') {
                if (filters.rsi.includes('Oversold')) apiFilters.maxRsi = 30;
                if (filters.rsi.includes('Overbought')) apiFilters.minRsi = 70;
            }
            if (filters.yield && filters.yield !== 'Any') {
                if (filters.yield.includes('> 1%')) apiFilters.minYield = 1;
                if (filters.yield.includes('> 2%')) apiFilters.minYield = 2;
                if (filters.yield.includes('> 3%')) apiFilters.minYield = 3;
            }
            if (filters.mcap && filters.mcap !== 'Any') {
                if (filters.mcap === 'Large') apiFilters.minMarketCap = 500000000000;
                if (filters.mcap === 'Mid') { apiFilters.minMarketCap = 100000000000; apiFilters.maxMarketCap = 500000000000; }
                if (filters.mcap === 'Small') apiFilters.maxMarketCap = 100000000000;
            }
            if (filters.volume && filters.volume !== 'Any') {
                apiFilters.volumeStatus = filters.volume;
            }

            const payload = { filters: apiFilters };
            if (filters.preset) payload.preset = filters.preset;

            const res = await runScreenerScan(payload);
            const resultsData = res?.data?.results || res?.data || res?.results || [];
            
            if (Array.isArray(resultsData) && resultsData.length > 0) {
                const mappedResults = resultsData.map(stock => ({
                    id: stock.symbol,
                    price: `₹${stock.price}`,
                    change: `${stock.change > 0 ? '+' : ''}${stock.change}%`,
                    isPositive: stock.change >= 0,
                    sector: stock.sector || 'Unknown',
                    mcap: stock.marketCap || 'N/A',
                    pe: stock.pe || 'N/A',
                    roe: stock.roe || 'N/A',
                    yield: stock.dividendYield || 'N/A',
                    confidence: stock.score || 50,
                    why: stock.bias === 'bullish' ? 'Strong momentum and positive signals.' : stock.bias === 'bearish' ? 'Weakness in current trend.' : 'Neutral technical indicators.',
                    tags: stock.bias ? [stock.bias.toUpperCase()] : ['NEUTRAL'],
                    trend: stock.sparklineData && stock.sparklineData.length > 0 ? stock.sparklineData.map(d => d.value) : Array.from({ length: 15 }, (_, i) => stock.price * (1 + (Math.random() * 0.04 - 0.02)))
                }));
                setResults(mappedResults);
                localStorage.setItem('radar_screener_results', JSON.stringify(mappedResults));
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error('Screener scan failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const runScan = () => runScanWithFilters(activeFilters);

    const exportToExcel = () => {
        if (!filteredResults.length) return;

        const rows = filteredResults.map(s => ({
            'Ticker':       (s.id || '').split('.')[0],
            'Sector':       s.sector        || '—',
            'Price':        s.price         || '—',
            'Change %':     s.change        || '—',
            'Market Cap':   s.mcap          || '—',
            'P/E Ratio':    s.pe            || '—',
            'ROE':          s.roe           || '—',
            'Div. Yield':   s.yield         || '—',
            'Signal %':     s.confidence != null ? `${s.confidence}%` : '—',
            'Tags':         Array.isArray(s.tags) ? s.tags.join(', ') : '—',
            'Insight':      s.why           || '—',
        }));

        const ws = XLSX.utils.json_to_sheet(rows);

        ws['!cols'] = [
            { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
            { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
            { wch: 10 }, { wch: 20 }, { wch: 50 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Screener Results');

        const timestamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `RADAR_Screener_${timestamp}.xlsx`);
    };

    React.useEffect(() => {
        if (Object.keys(activeFilters).length > 0) {
            runScan();
        } else if (results.length === 0 || results === MOCK_FALLBACK_RESULTS) {
            runScan();
        }
    }, [activeFilters]);

    React.useEffect(() => {
        loadMyFilters();
    }, []);

    React.useEffect(() => {
        const style = document.createElement('style');
        style.id = 'screeners-component-styles';
        style.innerHTML = `
            .filter-dropdown {
                animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 12px 30px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1);
                min-width: 240px;
            }
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .filter-chip { position: relative; }
            .filter-value-list { max-height: 250px; overflow-y: auto; }
            .filter-value-list::-webkit-scrollbar { width: 4px; }
            .filter-value-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
            .filter-chip:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.12); }
            .filter-chip.active { background: white; border-color: #3b82f6; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1); }
            .strategy-chip { transition: all 0.2s ease; cursor: pointer; }
            .strategy-chip.active { background: #eff6ff; border-color: #3b82f6; color: #2563eb; }
            .custom-table th { text-align: left; padding: 16px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; border-bottom: 1px solid #f1f5f9; }
            .custom-table td { padding: 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f8fafc; }
            .modal-overlay { background: rgba(15, 23, 42, 0.6); backdrop-blur: 4px; }
            .horizontal-carousel {
                display: flex;
                overflow-x: auto;
                gap: 1.5rem;
                padding: 4px 0 20px 0;
                scroll-behavior: smooth;
            }
            .horizontal-carousel::-webkit-scrollbar { display: none; }
            .custom-input-box {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 13px;
                font-weight: 600;
                width: 100%;
                outline: none;
                transition: all 0.2s;
            }
            .custom-input-box:focus {
                border-color: #3b82f6;
                background: white;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .fade-in-up { animation: fadeInUp 0.3s ease-out; }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            @keyframes scaleIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById('screeners-component-styles');
            if (el) document.head.removeChild(el);
        };
    }, []);

    const baseCardClass = "bg-[rgba(255,255,255,0.7)] backdrop-blur-[12px] rounded-[24px] border border-[rgba(255,255,255,0.4)] shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-6 mb-8";
    const filterChipClass = "filter-chip px-4 py-2 rounded-full border border-slate-200 bg-white/60 text-slate-600 font-bold text-[13px] flex items-center gap-2 cursor-pointer z-40 transition-all";

    return (
        <div className={`w-full ${isHero ? '' : 'min-h-screen py-8 px-4 md:px-10 bg-[#f8fafc]/50'}`}>
            <div className={`mx-auto fade-in ${isHero ? '' : 'max-w-[1600px]'}`}>
                
                <div className="mb-6 flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Smart Market Screener</h1>
                            <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                                <ShieldCheck size={14} className="text-blue-500" />
                                <Zap size={13} className="text-amber-500 fill-amber-400" />
                                Tailored for you: {userMode === 'TRADER' ? 'Active Trader' : 'Long-term Investor'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-blue-200"
                            onClick={handleSaveScreenerClick}
                        >
                            <Star size={18} strokeWidth={3} />
                            Save Screener
                        </button>
                    </div>
                </div>

                <div className={`${baseCardClass} !p-4 !mb-6 bg-white overflow-visible relative z-30`}>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                            <SlidersHorizontal size={18} className="text-slate-400" />
                            <span className="text-[14px] font-black text-slate-800 mr-2">Filters</span>
                        </div>

                        {allFilters.filter(f => visibleFilters.includes(f.id)).map(f => {
                            const Icon = f.icon;
                            return (
                                <div key={f.id} className="relative">
                                    <div 
                                        className={`${filterChipClass} ${openFilter === f.id ? 'active' : ''}`}
                                        onClick={() => setOpenFilter(openFilter === f.id ? null : f.id)}
                                    >
                                        <span className="opacity-70"><Icon size={15} /></span>
                                        <span>{f.label}</span>
                                        <span className="text-blue-600 font-black ml-1 line-clamp-1 max-w-[80px]">{activeFilters[f.id] || 'Any'}</span>
                                        {activeFilters[f.id] && activeFilters[f.id] !== 'Any' && (
                                            <span 
                                                className="ml-1 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newFilters = { ...activeFilters };
                                                    delete newFilters[f.id];
                                                    setActiveFilters(newFilters);
                                                }}
                                            >
                                                <X size={14} strokeWidth={3} />
                                            </span>
                                        )}
                                        <ChevronDown size={14} strokeWidth={3} className={`mt-0.5 transition-transform ${openFilter === f.id ? 'rotate-180 text-blue-500' : 'opacity-40'}`} />
                                    </div>

                                    {openFilter === f.id && (
                                        <div className="filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl border border-slate-200 p-3 min-w-[240px] z-50">
                                            <div className="p-1 text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Custom Value</div>
                                            <div className="px-1 mb-3">
                                                <input 
                                                    type="text" 
                                                    className="custom-input-box text-slate-800" 
                                                    placeholder={`Enter ${f.label}...`}
                                                    value={activeFilters[f.id] || ''}
                                                    onChange={(e) => setActiveFilters(prev => ({...prev, [f.id]: e.target.value}))}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="p-1 text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 border-t border-slate-50 pt-2">Presets</div>
                                            <div className="filter-value-list">
                                                {f.options.map(opt => (
                                                    <button 
                                                        key={opt}
                                                        onClick={() => handleFilterChange(f.id, opt)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-bold flex items-center justify-between transition-colors ${activeFilters[f.id] === opt ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        {opt}
                                                        {activeFilters[f.id] === opt && <Check size={14} strokeWidth={3} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="relative">
                            <button 
                                onClick={() => setOpenFilter(openFilter === 'add' ? null : 'add')}
                                className="flex items-center gap-2 text-[13px] font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full transition-all"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Add Filter
                            </button>
                            {openFilter === 'add' && (
                                <div className="filter-dropdown absolute top-full right-0 mt-2 bg-white rounded-xl border border-slate-200 p-2 min-w-[220px] z-50 filter-value-list shadow-2xl">
                                    <div className="p-2 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1 text-center">Available Metrics</div>
                                    {allFilters.filter(f => !visibleFilters.includes(f.id)).map(f => {
                                        const Icon = f.icon;
                                        return (
                                            <button 
                                                key={f.id}
                                                onClick={() => addMoreFilter(f.id)}
                                                className="w-full text-left px-3 py-2.5 rounded-lg text-[13.5px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-all"
                                            >
                                                <Icon size={16} className="opacity-50" />
                                                {f.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Quick Signals</span>
                        <div className="flex gap-2">
                            {strategies.map(s => {
                                const Icon = s.icon;
                                return (
                                    <button 
                                        key={s.id}
                                        onClick={() => handleStrategySelect(s)}
                                        className={`strategy-chip px-4 py-1.5 rounded-full border border-slate-100 bg-slate-50/50 text-[12px] font-bold flex items-center gap-2 transition-all ${activeStrategy === s.id ? 'active' : 'text-slate-500'}`}
                                    >
                                        <Icon size={14} className={s.color} />
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={runScan}
                            disabled={isLoading}
                            className="ml-auto bg-blue-600 text-white px-5 py-1.5 rounded-full text-[12px] font-black flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all disabled:opacity-60"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            {isLoading ? 'Scanning...' : 'Run Scan'}
                        </button>
                    </div>
                </div>

                <div className="mb-10 space-y-8">
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                                <TrendingUp size={18} className="text-orange-500" />
                                Trending Screeners
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {[
                                { title: 'IT Sector Breakouts', desc: 'Top tech companies breaking out on volume.', growth: '+12%', color: 'border-blue-100', preset: 'it_breakout', filters: { sector: 'IT' } },
                                { title: 'High Dividend Giants', desc: 'Companies offering >1% yield with stable growth.', growth: '+4.2%', color: 'border-emerald-100', preset: 'div', filters: { yield: '> 1%', mcap: 'Large' } },
                                { title: 'FMCG Defensive Play', desc: 'Low volatility consumer goods for safe investing.', growth: '+1.5%', color: 'border-amber-100', preset: 'fmcg_defensive', filters: { sector: 'FMCG' } },
                                { title: 'LargeCap Growth Alpha', desc: 'Market leaders showing positive momentum.', growth: '+22%', color: 'border-purple-100', preset: 'largecap_growth', filters: { mcap: 'Large', change: '> 0%' } },
                                { title: 'Nifty 50 Rebound', desc: 'Oversold bluechips poised for a bounce.', growth: '+5.4%', color: 'border-slate-100', preset: 'nifty_rebound', filters: { change: '< 0%' } },
                                { title: 'Bluechip Scans', desc: 'The most reliable large cap institutions.', growth: '+18.4%', color: 'border-cyan-100', preset: 'bluechip', filters: { mcap: 'Large' } },
                                { title: 'Value Picks', desc: 'Undervalued stocks with P/E under 15.', growth: '+31%', color: 'border-rose-100', preset: 'value_picks', filters: { pe: 'Low (<15)' } },
                                { title: 'Pharma Recovery', desc: 'Healthcare stocks gaining traction.', growth: '+2.1%', color: 'border-teal-100', preset: 'pharma_recovery', filters: { sector: 'Healthcare' } },
                                { title: 'EV Supply Chain', desc: 'Auto and ancillaries driving EV adoption.', growth: '+14%', color: 'border-lime-100', preset: 'ev_supply', filters: { sector: 'Auto' } },
                                { title: 'Banking Consolidation', desc: 'Financial sector stocks near support.', growth: '+3.8%', color: 'border-indigo-100', preset: 'banking_consolidation', filters: { sector: 'Finance' } }
                            ].map((scr, i) => (
                                <div key={i} onClick={() => activeFilters.preset === scr.preset ? setActiveFilters({}) : setActiveFilters({ ...scr.filters, preset: scr.preset })} className={`w-full bg-white border ${activeFilters.preset === scr.preset ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md scale-[1.02]' : `${scr.color} hover:shadow-md`} p-5 rounded-2xl shadow-sm transition-all cursor-pointer group flex flex-col justify-between`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-[15px] text-slate-800 group-hover:text-blue-600 line-clamp-1">{scr.title}</h3>
                                        <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full shrink-0">{scr.growth}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 mb-4 line-clamp-2">{scr.desc}</p>
                                    <div className="flex items-center justify-end text-[12px] font-bold text-slate-400 mt-auto">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                                <Star size={18} className="text-amber-500" />
                                Ready-made Expert Screeners
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {readyMade.map(item => {
                                const Icon = item.icon || Activity;
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => activeFilters.preset === item.id ? setActiveFilters({}) : setActiveFilters({ ...item.filters, preset: item.id })}
                                        className={`w-full bg-white border p-5 rounded-2xl shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${activeFilters.preset === item.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md scale-[1.02]' : 'border-slate-100 hover:shadow-md'}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-4 mb-3">
                                            <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                                <Icon size={20} strokeWidth={3} />
                                            </div>
                                            <h3 className="font-black text-[15px] text-slate-800">{item.title}</h3>
                                        </div>
                                        <p className="text-[12px] font-bold text-slate-400 leading-relaxed mb-4">{item.desc}</p>
                                        </div>
                                        <button className="w-full py-2 bg-slate-50 text-slate-400 font-black text-[11px] uppercase tracking-widest rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all mt-auto">Launch Preview</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {savedScreeners.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h2 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
                                    <Star size={18} className="text-blue-500" />
                                    Your Saved Screeners
                                </h2>
                            </div>
                            <div className="horizontal-carousel">
                                {savedScreeners.map(screener => (
                                    <div 
                                        key={screener.id} 
                                        onClick={() => handleLoadSavedScreener(screener)}
                                        className={`min-w-[300px] bg-white border p-5 rounded-2xl shadow-sm transition-all cursor-pointer group relative ${activeFilters.preset === screener.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md scale-[1.02]' : 'border-slate-100 hover:shadow-md'}`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                                                    <Filter size={20} strokeWidth={3} />
                                                </div>
                                                <h3 className="font-black text-[15px] text-slate-800 line-clamp-1">{screener.name}</h3>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteSavedScreener(e, screener.id)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-[12px] font-bold text-slate-400 leading-relaxed mb-4 line-clamp-2">{screener.purpose}</p>
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {Object.entries(screener.filters).map(([k, v]) => {
                                                if (v && v !== 'Any' && v !== 'All') {
                                                    return (
                                                        <span key={k} className="text-[10px] font-black px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-100 capitalize">
                                                            {k}: <span className="text-blue-600">{v}</span>
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                        <button className="w-full py-2 bg-slate-50 text-slate-400 font-black text-[11px] uppercase tracking-widest rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">Apply Filters</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {!hasActiveFilters ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-100 rounded-3xl shadow-sm mt-8 mb-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Filter size={32} className="text-slate-300" />
                        </div>
                        <h2 className="text-[20px] font-black text-slate-800 mb-3">Waiting for your filters to step up</h2>
                        <p className="text-[14px] font-bold text-slate-400 max-w-md">
                            Select custom filters, click a trending screener, or launch a ready-made expert screener to see live market insights.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 mt-8">
                        <div className="lg:col-span-12">
                            <div className={`${baseCardClass} !p-0 overflow-hidden bg-white`}>
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">Screener Insights</h2>
                                    <p className="text-[12px] font-bold text-slate-500">Live results matching your active criteria</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Find ticker..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-xs font-bold w-48 focus:ring-2 focus:ring-blue-50 outline-none"
                                        />
                                    </div>
                                    <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm text-xs font-bold text-slate-600">
                                        Matches: <span className="text-blue-600">{filteredResults.length}</span>
                                    </div>
                                    {Math.ceil(filteredResults.length / ITEMS_PER_PAGE) > 1 && (
                                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="text-xs font-bold text-slate-600 px-2">
                                                {currentPage} / {Math.ceil(filteredResults.length / ITEMS_PER_PAGE)}
                                            </span>
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredResults.length / ITEMS_PER_PAGE), p + 1))}
                                                disabled={currentPage === Math.ceil(filteredResults.length / ITEMS_PER_PAGE)}
                                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <button 
                                        onClick={runScan}
                                        disabled={isLoading}
                                        className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                                        {isLoading ? "Scanning..." : "Refresh Results"}
                                    </button>
                                    <button
                                        onClick={exportToExcel}
                                        disabled={filteredResults.length === 0}
                                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Download size={13} />
                                        Export Report
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full custom-table">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th>Ticker</th>
                                            <th>Price</th>
                                            <th>Change</th>
                                            <th>Trend</th>
                                            <th>Mcap</th>
                                            <th>Metrics</th>
                                            <th>Filters</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResults.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(stock => (
                                            <tr key={stock.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={`https://logo.clearbit.com/${(stock.id || '').split('.')[0]}.com`} 
                                                            alt="Logo" 
                                                            className="w-8 h-8 rounded object-cover" 
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                        <div className="w-8 h-8 rounded bg-slate-100 hidden items-center justify-center font-black text-[10px] text-slate-400 text-center uppercase p-1">Stock</div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{(stock.id || '').split('.')[0]}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{stock.sector}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="font-bold text-slate-700">{stock.price}</td>
                                                <td>
                                                    <span className={`px-2 py-0.5 rounded text-[12px] font-black ${stock.isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                                        {stock.change}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="w-24 h-8">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={stock.trend.map((v, i) => ({ price: v, i }))}>
                                                                <defs>
                                                                    <linearGradient id={`grad-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor={stock.isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                                                                        <stop offset="95%" stopColor={stock.isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <YAxis domain={['dataMin', 'dataMax']} hide />
                                                                <Area 
                                                                    type="monotone" 
                                                                    dataKey="price" 
                                                                    stroke={stock.isPositive ? '#10b981' : '#f43f5e'} 
                                                                    fill={`url(#grad-${stock.id})`}
                                                                    strokeWidth={2}
                                                                    isAnimationActive={false}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </td>
                                                <td className="text-slate-500 font-bold">{stock.mcap}</td>
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                            <span className="text-slate-400">P/E:</span>
                                                            <span className="text-slate-600">{stock.pe}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                            <span className="text-slate-400">ROE:</span>
                                                            <span className="text-slate-600">{stock.roe}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                            <span className="text-slate-400">Yield:</span>
                                                            <span className="text-slate-600">{stock.yield}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="max-w-[300px]">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Object.entries(activeFilters).map(([k, v]) => {
                                                            if (v && v !== 'Any' && v !== 'All') {
                                                                return (
                                                                    <span key={k} className="text-[10px] font-black px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-100 capitalize">
                                                                        {k}: <span className="text-blue-600">{v}</span>
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                        {Object.keys(activeFilters).filter(k => activeFilters[k] && activeFilters[k] !== 'Any' && activeFilters[k] !== 'All').length === 0 && (
                                                            <span className="text-[11px] font-bold text-slate-400 italic">No active filters</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => toggleWatchlist(e, stock.id)}
                                                            className={`p-2 rounded-lg transition-all shadow-sm border ${watchlist.includes((stock.id || '').split('.')[0].toUpperCase()) ? 'bg-amber-100 text-amber-500 border-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500 border-slate-100'}`}
                                                        >
                                                            <Star size={16} fill={watchlist.includes((stock.id || '').split('.')[0].toUpperCase()) ? 'currentColor' : 'none'} />
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate(`/investor-stock/${(stock.id || '').split('.')[0]}`)}
                                                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                                        >
                                                            <ArrowUpRight size={16} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredResults.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-20">
                                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                                        <Search size={48} />
                                                        <p className="font-black text-lg">No matches found</p>
                                                        <button onClick={() => setActiveFilters({})} className="text-blue-600 font-black">Reset filters</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 modal-overlay" onClick={() => setShowCreateModal(false)} />
                        <div className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-2xl fade-in-up">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Create New Filter</h2>
                                    <p className="text-sm font-bold text-slate-400">Add a custom metric to your radar.</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filter Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="e.g. FII Holding %"
                                        value={newFilterName}
                                        onChange={e => setNewFilterName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Options (comma separated)</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 h-20 focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="Large, Mid, Small..."
                                        value={newFilterOptions}
                                        onChange={e => setNewFilterOptions(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Logic Query</label>
                                    <div className="p-4 bg-slate-900 rounded-xl">
                                        <textarea
                                            className="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none resize-none"
                                            rows={2}
                                            value={newFilterQuery}
                                            onChange={e => setNewFilterQuery(e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                                {filterError && (
                                    <p className="text-xs font-bold text-rose-500 pl-1">{filterError}</p>
                                )}
                                <button
                                    onClick={handleCreateFilter}
                                    disabled={filterSaving}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg shadow-xl shadow-blue-200 mt-4 active:scale-95 transition-all disabled:opacity-60"
                                >
                                    {filterSaving ? 'Saving...' : 'Create Filter Metric'}
                                </button>
                            </div>

                            {myFilters.length > 0 && (
                                <div className="mt-6 pt-5 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">My Saved Filters</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {myFilters.map(f => (
                                            <div key={f._id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-black text-slate-700">{f.name}</p>
                                                    {f.options?.length > 0 && (
                                                        <p className="text-[10px] text-slate-400 font-bold">{f.options.join(', ')}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMyFilter(f._id)}
                                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showSignalModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 modal-overlay" onClick={() => setShowSignalModal(null)} />
                        <div className="bg-white rounded-3xl w-full max-w-sm p-8 relative z-10 shadow-2xl scale-in text-center">
                            {(() => {
                                const Icon = showSignalModal.icon || Activity;
                                return (
                                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-blue-50 text-blue-600`}>
                                        <Icon size={32} strokeWidth={3} />
                                    </div>
                                );
                            })()}
                            <h2 className="text-xl font-black text-slate-800 mb-2">{showSignalModal.label}</h2>
                            <p className="text-slate-500 font-bold mb-6 text-sm leading-relaxed">{showSignalModal.desc}</p>
                            <div className="p-4 bg-slate-50 rounded-2xl text-left mb-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Metrics Configured</span>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(showSignalModal.filters).map(([k, v]) => (
                                        <span key={k} className="text-[11px] font-black px-2 py-1 bg-white border border-slate-100 rounded text-slate-600 capitalize">
                                            {k}: <span className="text-blue-600">{v}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setShowSignalModal(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black shadow-lg">Close Explanation</button>
                        </div>
                    </div>
                )}

                {/* ── Save Screener Modal ───────────────────────────── */}
                {showSaveScreenerModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 modal-overlay" onClick={() => setShowSaveScreenerModal(false)} />
                        <div className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-2xl fade-in-up">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Save Screener</h2>
                                    <p className="text-sm font-bold text-slate-400">Save your current filters for later use.</p>
                                </div>
                                <button onClick={() => setShowSaveScreenerModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Screener Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="e.g. My High Dividend Strategy"
                                        value={newScreenerName}
                                        onChange={e => setNewScreenerName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Purpose / Why</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 h-24 focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="Why did you build this screener? What's its purpose?"
                                        value={newScreenerPurpose}
                                        onChange={e => setNewScreenerPurpose(e.target.value)}
                                    />
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <p className="text-[11px] font-black text-blue-800 uppercase tracking-widest mb-2">Filters to Save</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(activeFilters).map(([k, v]) => {
                                            if (v && v !== 'Any' && v !== 'All') {
                                                return (
                                                    <span key={k} className="text-[10px] font-black px-2 py-0.5 bg-white text-slate-600 rounded border border-blue-100 capitalize">
                                                        {k}: <span className="text-blue-600">{v}</span>
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                                <button
                                    onClick={handleConfirmSaveScreener}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg shadow-xl shadow-blue-200 mt-4 active:scale-95 transition-all"
                                >
                                    Save Screener
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Screeners;
