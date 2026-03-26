import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import YourInvestments from '../components/investor/YourInvestments';
import MostBoughtStocks from '../components/investor/MostBoughtStocks';
import SharedTickerTape from '../components/landing/TickerTape';
import Watchlist from '../components/investor/Watchlist';
import Screeners from '../components/investor/Screeners';

import {
    LayoutDashboard,
    Star,
    Filter,
    Newspaper,
    Search,
    Bell,
    CheckCircle,
    User,
    Settings,
    HelpCircle,
    Activity,
    TrendingUp,
    TrendingDown,
    LogOut,
    Menu,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
    ReferenceLine,
    LabelList,
} from "recharts";

import "./InvestorDashboard.css";
import { fetchDiscoveryShelves, fetchMarketMood, fetchValuation } from "../api/fundamentalApi";
import { fetchSectorPerformance, fetchMarketData, fetchTrendingSearches, logSearchQuery, fetchMarketNews } from "../api/marketApi";
import { fetchEconomicCalendar } from "../api/calendarApi";
import { updateUserMode } from "../api/userApi";
import { useHeaderData } from "../hooks/useHeaderData";

const formatNotificationTime = (value) => {
    if (!value) return "Now";

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return value;

    const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
};

const DEFAULT_REGION = String(import.meta.env.VITE_DEFAULT_REGION || 'IN').toUpperCase();
const VALUATION_BENCHMARK_BY_REGION = {
    IN: 'NIFTY 50',
    US: 'S&P 500',
    GLOBAL: 'Global Composite',
};

const inferRegionCode = (asset) => {
    const symbol = String(asset?.symbol || asset?.name || '').toUpperCase();

    if (symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol.includes('NIFTY') || symbol.includes('SENSEX') || symbol.includes('INR')) {
        return 'IN';
    }
    if (symbol.includes('FTSE') || symbol.includes('GBP')) {
        return 'UK';
    }
    if (symbol.includes('NIKKEI') || symbol.includes('JPY')) {
        return 'JP';
    }
    if (symbol.includes('DAX') || symbol.includes('EURO') || symbol.includes('EUR')) {
        return 'EU';
    }

    return DEFAULT_REGION;
};

const countryFlag = (code) => {
    if (code === 'US') return '🇺🇸';
    if (code === 'UK') return '🇬🇧';
    if (code === 'JP') return '🇯🇵';
    if (code === 'EU') return '🇪🇺';
    return '🇮🇳';
};

const displaySymbol = (value) => String(value || '').replace(/\.(NS|BO)$/i, '');

const extractHeadlineSymbol = (value) => {
    const text = String(value || '').toUpperCase();
    const matches = text.match(/\b[A-Z]{3,12}\b/g) || [];
    const blacklist = new Set(['THE', 'AND', 'WITH', 'FROM', 'MARKET', 'STOCK', 'STOCKS', 'NEWS', 'INDEX']);
    return matches.find((token) => !blacklist.has(token)) || null;
};

const FALLBACK_THEME_ROWS = {
    rising: [
        { name: 'AI Infrastructure', trend: '+3.2% wk', icon: '⚡' },
        { name: 'Defense Manufacturing', trend: '+2.6% wk', icon: '🛡️' },
        { name: 'Green Energy', trend: '+2.1% wk', icon: '🌿' },
    ],
    falling: [
        { name: 'Legacy Telecom', trend: '-1.8% wk', icon: '📉' },
        { name: 'Sugar Cycle', trend: '-1.4% wk', icon: '🧊' },
        { name: 'Cement Weakness', trend: '-1.1% wk', icon: '🛰️' },
    ],
};

const themes = {
    blue: {
        dot: '#3b82f6',
        gradient: `linear-gradient(180deg, #f0f9ff 0%, #e1effe 100%)`
    },
    emerald: {
        dot: '#10b981',
        gradient: `linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)`
    },
    purple: {
        dot: '#8b5cf6',
        gradient: `linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)`
    },
    rose: {
        dot: '#f43f5e',
        gradient: `linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)`
    },
    slate: {
        dot: '#64748b',
        gradient: `linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)`
    }
};

const InvestorMode = ({ onToggleMode }) => {
    const navigate = useNavigate();
    const {
        profile,
        userInitial,
        notifications,
        unreadCount,
        isLoadingNotifications,
        isMarkingNotifications,
        markAllNotificationsRead,
    } = useHeaderData();
    useEffect(() => {
        const currentTheme = 'blue';
        const fullBackground = themes[currentTheme].gradient;

        // Apply global background properties
        document.documentElement.style.setProperty('--investor-bg', fullBackground);
        
        // 1:1 EXACT "Minimalist Sky" linear gradient from latest Step 3759 reference image
        document.body.style.backgroundColor = '#f0f9ff'; 
        document.body.style.backgroundImage = fullBackground;
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundSize = 'cover';
        document.body.style.color = '#1e293b';
        document.documentElement.style.setProperty('transition', 'background 0.5s ease-in-out');

        return () => {
            document.documentElement.style.removeProperty('--investor-bg');
            document.documentElement.style.removeProperty('transition');
            document.body.style.backgroundColor = '';
            document.body.style.backgroundImage = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.backgroundSize = '';
            document.body.style.color = '';
        };
    }, []);

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [trendingSearches, setTrendingSearches] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const searchContainerRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userMode");
        localStorage.removeItem("mode");
        navigate("/", { state: { skipPreloader: true } });
    };

    const [activeModule, setActiveModule] = useState("DASHBOARD");

    useEffect(() => {
        let isMounted = true;

        const loadTrending = async () => {
            const trends = await fetchTrendingSearches();
            if (isMounted) {
                setTrendingSearches(trends.slice(0, 6));
            }
        };

        loadTrending();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const query = searchQuery.trim();

        if (!query) {
            setSearchResults([]);
            setIsSearching(false);
            return undefined;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await fetchMarketData({ search: query });
                if (isMounted) {
                    setSearchResults(Array.isArray(response) ? response.slice(0, 8) : []);
                }
            } catch (error) {
                console.error('Search failed:', error);
                if (isMounted) {
                    setSearchResults([]);
                }
            } finally {
                if (isMounted) {
                    setIsSearching(false);
                }
            }
        }, 250);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!searchContainerRef.current) {
                return;
            }

            if (!searchContainerRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, []);

    useEffect(() => {
        if (!showSearchDropdown) {
            setHighlightedIndex(-1);
            return;
        }

        const optionsLength = searchQuery.trim().length > 0 ? searchResults.length : trendingSearches.length;
        if (optionsLength === 0) {
            setHighlightedIndex(-1);
            return;
        }

        if (highlightedIndex >= optionsLength) {
            setHighlightedIndex(0);
        }
    }, [showSearchDropdown, searchQuery, searchResults, trendingSearches, highlightedIndex]);

    const openStockPage = (value) => {
        const symbol = String(value || '').trim();
        if (!symbol) {
            return;
        }
        navigate(`/stocks/${encodeURIComponent(symbol.toUpperCase())}`);
    };

    const handleSearchSelect = async (item) => {
        const label = item?.symbol || item?.name || '';
        setSearchQuery(label);
        setShowSearchDropdown(false);
        setHighlightedIndex(-1);
        setActiveModule('WATCHLIST');
        openStockPage(label);

        if (label) {
            await logSearchQuery(label);
        }
    };

    const handleTrendingSelect = async (term) => {
        setSearchQuery(term);
        setShowSearchDropdown(false);
        setHighlightedIndex(-1);
        setActiveModule('WATCHLIST');
        openStockPage(term);
        await logSearchQuery(term);
    };

    return (
        <div className="dashboard-container investor-theme pt-6">
            <header className="navbar rounded-2xl mx-6 lg:mx-10 border border-blue-100 shadow-sm relative z-[110]">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#3E84F6]/10 flex items-center justify-center border border-[#3E84F6]/20 overflow-hidden shadow-inner">
                        <img
                            src="/radar-logo-final.jpg"
                            alt="Radar Logo"
                            className="w-full h-full object-cover scale-100"
                        />
                    </div>
                    <span className="brand-name font-black tracking-tighter text-2xl" style={{ color: '#3E84F6' }}>RADAR</span>
                </div>

                {/* Main Navigation */}
                <div className="hidden lg:flex items-center gap-6 xl:gap-10 ml-8 xl:ml-12">
                    {[
                        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'WATCHLIST', label: 'Watchlist', icon: Star },
                        { id: 'SCREENERS', label: 'Screeners', icon: Filter },
                        { id: 'NEWS', label: 'News', icon: Newspaper }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveModule(item.id)}
                            className={`flex items-center gap-2.5 text-sm font-black tracking-tight transition-all duration-300 ${activeModule === item.id
                                ? 'scale-105'
                                : 'hover:scale-105'
                                }`}
                            style={{ color: '#3E84F6' }}
                        >
                            <item.icon size={18} strokeWidth={2.5} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="hidden md:flex ml-auto mr-4 lg:mr-8 relative group" ref={searchContainerRef}>
                    <div className="relative w-48 lg:w-72 xl:w-80">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(62, 132, 246, 0.5)' }}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search stocks..."
                            value={searchQuery}
                            onFocus={() => {
                                setShowSearchDropdown(true);
                                setHighlightedIndex(searchQuery.trim().length > 0 ? (searchResults.length > 0 ? 0 : -1) : (trendingSearches.length > 0 ? 0 : -1));
                            }}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearchDropdown(true);
                                setHighlightedIndex(0);
                            }}
                            onKeyDown={async (e) => {
                                const usingSearchResults = searchQuery.trim().length > 0;
                                const optionsLength = usingSearchResults ? searchResults.length : trendingSearches.length;

                                if (e.key === 'ArrowDown' && optionsLength > 0) {
                                    e.preventDefault();
                                    setShowSearchDropdown(true);
                                    setHighlightedIndex((prev) => (prev + 1 + optionsLength) % optionsLength);
                                    return;
                                }

                                if (e.key === 'ArrowUp' && optionsLength > 0) {
                                    e.preventDefault();
                                    setShowSearchDropdown(true);
                                    setHighlightedIndex((prev) => (prev - 1 + optionsLength) % optionsLength);
                                    return;
                                }

                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (usingSearchResults && searchResults.length > 0) {
                                        const selected = searchResults[Math.max(0, highlightedIndex)] || searchResults[0];
                                        await handleSearchSelect(selected);
                                    } else if (!usingSearchResults && trendingSearches.length > 0) {
                                        const selectedTrend = trendingSearches[Math.max(0, highlightedIndex)] || trendingSearches[0];
                                        await handleTrendingSelect(selectedTrend);
                                    } else if (searchQuery.trim()) {
                                        await handleTrendingSelect(searchQuery.trim().toUpperCase());
                                    }
                                    return;
                                }

                                if (e.key === 'Escape') {
                                    setShowSearchDropdown(false);
                                    setHighlightedIndex(-1);
                                }
                            }}
                            className="w-full rounded-full py-2.5 pl-12 pr-4 text-xs font-semibold focus:outline-none transition-all bg-white border border-blue-100/50 text-blue-900 focus:border-[#3E84F6] focus:shadow-sm placeholder:text-blue-300"
                        />

                        {showSearchDropdown && (
                            <div className="absolute top-12 left-0 right-0 bg-white border border-blue-100 rounded-2xl shadow-xl overflow-hidden z-[120]">
                                {isSearching && (
                                    <div className="px-4 py-3 text-xs font-semibold text-slate-500">Searching market...</div>
                                )}

                                {!isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                                    <div className="px-4 py-3 text-xs font-semibold text-slate-500">No matching assets found.</div>
                                )}

                                {!isSearching && searchQuery.trim().length > 0 && searchResults.length > 0 && (
                                    <div className="max-h-72 overflow-y-auto">
                                        {searchResults.map((item) => (
                                            <button
                                                key={`${item.type}-${item.symbol}`}
                                                onClick={() => handleSearchSelect(item)}
                                                className={`w-full text-left px-4 py-3 transition-colors border-b border-blue-50 ${highlightedIndex >= 0 && searchResults[highlightedIndex] === item ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800">{displaySymbol(item.symbol)}</p>
                                                        <p className="text-[11px] text-slate-500">{item.name}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#3E84F6]">{item.type}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!isSearching && searchQuery.trim().length === 0 && (
                                    <div className="px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Trending</p>
                                        <div className="flex flex-wrap gap-2">
                                            {trendingSearches.map((term) => (
                                                <button
                                                    key={term}
                                                    onClick={() => handleTrendingSelect(term)}
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors ${highlightedIndex >= 0 && trendingSearches[highlightedIndex] === term ? 'bg-blue-200 text-blue-800' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right-side buttons (Notifications, Profile) */}

                <div className="nav-buttons flex items-center gap-5 mr-2">
                    {/* Notifications */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsNotificationsOpen(true)}
                        onMouseLeave={() => setIsNotificationsOpen(false)}
                    >
                        <button
                            className="transition-all duration-200 relative w-10 h-10 flex items-center justify-center hover:bg-blue-50 rounded-full"
                            style={{ color: '#3E84F6' }}
                        >
                            <Bell size={22} strokeWidth={2} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full border-2 border-white text-[9px] font-black text-white flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>


                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-12 w-80 rounded-xl shadow-2xl border py-2 backdrop-blur-xl z-[100] transform origin-top-right transition-all bg-white border-[#1F3D2B]/10">
                                <div className="px-4 py-2 border-b border-gray-700/50 flex justify-between items-center">
                                    <h3 className="font-bold text-sm text-[#1F3D2B]">Notifications</h3>
                                    <button
                                        onClick={markAllNotificationsRead}
                                        disabled={isMarkingNotifications || unreadCount === 0}
                                        className="text-xs text-[#3E84F6] disabled:text-gray-400 hover:text-blue-700 transition-colors"
                                    >
                                        {isMarkingNotifications ? 'Saving...' : 'Mark read'}
                                    </button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {isLoadingNotifications ? (
                                        <div className="px-4 py-6 text-xs text-gray-500 text-center">Loading notifications...</div>
                                    ) : notifications.length > 0 ? (
                                        notifications.map((notification) => (
                                            <div key={notification._id || notification.id} className="px-4 py-3 border-b border-gray-700/30 hover:bg-gray-50 cursor-pointer flex gap-3">
                                                <div className="mt-1"><CheckCircle size={14} className={notification.read ? "text-gray-400" : "text-[#3E84F6]"} /></div>
                                                <div>
                                                    <p className="text-xs font-semibold text-[#1F3D2B]">{notification.title || notification.message}</p>
                                                    {notification.message && notification.title && (
                                                        <p className="text-[11px] text-gray-500 mt-1">{notification.message}</p>
                                                    )}
                                                    <p className="text-[10px] text-gray-500 mt-1">{formatNotificationTime(notification.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-6 text-xs text-gray-500 text-center">No notifications yet.</div>
                                    )}
                                </div>
                                <div className="px-4 py-2 text-center text-xs text-gray-500 cursor-pointer hover:text-[#3E84F6] transition-colors">View all activity</div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <div
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="profile-avatar shadow-[#3E84F6]/20 hover:scale-105 transition-transform"
                        >
                            {userInitial}
                        </div>


                        {/* Profile Dropdown Content */}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-12 w-72 rounded-xl shadow-2xl border py-2 backdrop-blur-xl z-[100] transform origin-top-right transition-all bg-white border-[#1F3D2B]/10">

                                {/* User Info */}
                                <div className="px-4 py-4 border-b border-gray-700/50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-bold text-white">
                                        {userInitial}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1F3D2B]">{profile?.username || 'Current User'}</p>
                                        <p className="text-xs text-gray-500">{profile?.email || localStorage.getItem('email') || 'user@radar.com'}</p>
                                    </div>
                                </div>

                                {/* Navigation Links */}
                                <div className="py-2">
                                    <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-[#1F3D2B] hover:bg-[#1F3D2B]/5">
                                        <User size={16} /> My Profile
                                    </button>

                                    <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-[#1F3D2B] hover:bg-[#1F3D2B]/5">
                                        <Settings size={16} /> Settings
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-[#1F3D2B] hover:bg-[#1F3D2B]/5">
                                        <HelpCircle size={16} /> Help & Support
                                    </button>
                                </div>

                                {/* Mode Switcher */}
                                <div className="border-t border-b border-gray-700/50 py-3 px-4">
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-3 text-center text-[#1F3D2B]/60">
                                        Choose Your Interface
                                    </div>

                                    <div
                                        className="relative w-full h-12 rounded-full cursor-pointer flex items-center p-1.5 transition-all duration-300 shadow-inner group bg-[#FBF7F2] border border-[#1F3D2B]/10"
                                        onClick={() => {
                                            localStorage.setItem('mode', 'TRADER');
                                            updateUserMode('TRADER').catch((error) => {
                                                console.error('Failed to sync preferred mode:', error);
                                            });
                                            onToggleMode();
                                        }}
                                    >
                                        {/* Active Indicator */}
                                        <div
                                            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform translate-x-0 bg-white border border-[#1F3D2B]/10 shadow-sm"
                                        >
                                        </div>

                                        {/* Investor Mode */}
                                        <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full">
                                            <Activity size={16} className="text-[#1F3D2B] scale-110 drop-shadow-sm" />
                                            <span className="text-xs font-bold text-[#1F3D2B]">Investor</span>
                                        </div>

                                        {/* Trader Mode */}
                                        <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full opacity-60 hover:opacity-100 transition-opacity">
                                            <TrendingUp size={16} className="text-gray-400 group-hover:text-gray-600" />
                                            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600">Trader</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logout */}
                                <div className="pt-2 pb-1">
                                    <button
                                        onClick={() => { setIsProfileOpen(false); setShowLogoutModal(true); }}
                                        className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-blue-600 hover:bg-blue-50/50"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger Menu */}
                    <div className="lg:hidden flex items-center ml-2 border-l border-slate-100 pl-4">
                        <Menu size={24} className="text-[#3E84F6] cursor-pointer hover:text-blue-700" />
                    </div>
                </div>
            </header>

            {activeModule === "DASHBOARD" && (
                <div className="my-6">
                    <SharedTickerTape variant="investor" />
                </div>
            )}

            <main className="content fade-in transition-all duration-300">
                <InvestorView activeModule={activeModule} />
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 fade-in">
                    <div className="w-full max-w-[420px] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transform transition-all scale-100 bg-[#FCFBF8] border-none">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[#FFF0F2] text-[#E12B56]">
                                <LogOut size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-[22px] font-bold mb-2.5 text-[#1E293B]">Signing Out?</h3>
                            <p className="text-[15px] mb-8 text-[#64748B] font-medium leading-relaxed">
                                Ready to sign off, Captain? The market sleeps for no one!
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-3.5 rounded-xl font-bold transition-all bg-[#F1EFEA] text-[#1F3D2B] hover:bg-[#E5E2DB]"
                                >
                                    No, Stay
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] hover:opacity-90 shadow-lg shadow-rose-500/30 transition-all"
                                >
                                    Yes, Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestorMode;

const MarketMoodGauge = () => {
    const [score, setScore] = useState(50);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const res = await fetchMarketMood();
                if (res) {
                    const liveScore = Number(res.score ?? res.value);
                    setScore(Number.isFinite(liveScore) ? liveScore : 50);
                }
            } catch (e) {
                console.error("Failed to load Market Mood:", e);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        }

        load();
        timer = setInterval(load, 60000);

        return () => clearInterval(timer);
    }, []);

    const needleRotation = (score / 100) * 180 - 90;

    return (
        <div className="investor-card p-6 h-full flex flex-col justify-between relative overflow-hidden group">
            {/* Background blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-all duration-500"></div>

            {isLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">📡</span>
                    <span className="text-xs font-bold text-rose-600">Mood Sensor Offline</span>
                    <button onClick={() => window.location.reload()} className="mt-3 text-[10px] bg-white/5 border border-current px-4 py-1.5 rounded-lg text-rose-600 font-black hover:bg-rose-50 hover:border-rose-300 shadow-sm transition-all uppercase tracking-wider">RETRY</button>
                </div>
            )}

            <div className="card-header flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Market Mood</h3>
                    <p className="text-xs text-slate-500 font-medium">Sentiment Index</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${score > 75 ? 'bg-green-100 text-green-700' : score < 25 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {score > 75 ? 'Greed' : score < 25 ? 'Fear' : 'Neutral'}
                </div>
            </div>

            <div className="gauge-chart-wrapper relative flex flex-col items-center justify-end h-32 mt-2">
                {/* Gauge SVG */}
                <svg viewBox="0 0 200 110" className="w-full h-full">
                    {/* Gradient and Filter Definitions */}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" /> {/* Red for Fear */}
                            <stop offset="50%" stopColor="#eab308" /> {/* Yellow for Neutral */}
                            <stop offset="100%" stopColor="#22c55e" /> {/* Green for Greed */}
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Background Arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />

                    {/* Foreground Arc (Gradient) */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="20" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="0" filter="url(#glow)" />

                    {/* Ticks */}
                    {[0, 25, 50, 75, 100].map((tick, i) => {
                        const angle = (tick / 100) * 180 - 180;
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 100 + 70 * Math.cos(rad);
                        const y1 = 100 + 70 * Math.sin(rad);
                        const x2 = 100 + 60 * Math.cos(rad);
                        const y2 = 100 + 60 * Math.sin(rad);
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" strokeOpacity="0.8" />;
                    })}
                </svg>

                {/* Needle */}
                <div
                    className="absolute bottom-2 left-1/2 w-1 h-24 bg-slate-800 origin-bottom rounded-full transition-transform duration-1000 ease-out z-10"
                    style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rounded-full"></div>
                </div>

                {/* Needle Base */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-slate-800 rounded-full border-4 border-white shadow-lg z-20"></div>

                {/* Score Display */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-0">
                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{score}</span>
                    <span className="text-xs text-slate-400 block -mt-1">Score</span>
                </div>
            </div>

            <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 px-4">
                <span>Ext. Fear</span>
                <span>Neutral</span>
                <span>Ext. Greed</span>
            </div>
        </div>

    );
};

const ValuationThermometer = () => {
    const [valData, setValData] = useState({ pe: 0, pb: 0, avgPe: 0, avgPb: 0 });
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const res = await fetchValuation();
                if (res) {
                    setValData({
                        pe: Number(res.peRatio) || 0,
                        pb: Number(res.pbRatio) || 0,
                        avgPe: Number(res.avgPe) || 20.1,
                        avgPb: Number(res.avgPb) || 3.5,
                    });
                }
            } catch (e) {
                console.error("Failed to load valuations:", e);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        }

        load();
        timer = setInterval(load, 120000);

        return () => clearInterval(timer);
    }, []);
    const getPos = (val, avg) => {
        if (!val || !avg) return '50%';
        const ratio = val / avg;
        let pos = (ratio - 0.5) * 80 + 10;
        return `${Math.min(95, Math.max(5, pos))}%`;
    };

    return (
        <div className="investor-card p-6 h-full flex flex-col relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">📈</span>
                    <span className="text-xs font-bold text-rose-600">Valuation Data Unavailable</span>
                </div>
            )}
            <div className="card-header flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Valuation Check</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{VALUATION_BENCHMARK_BY_REGION[DEFAULT_REGION] || VALUATION_BENCHMARK_BY_REGION.IN}</span>
            </div>

            <div className="space-y-8 flex-1">
                {/* P/E Ratio */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block tracking-wider">P/E RATIO</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-slate-800">{(valData.pe || 0).toFixed(1)}</span>
                                <span className="text-[10px] text-slate-400 font-medium">({valData.pe > valData.avgPe ? 'Elevated' : 'Discount'})</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Avg: {valData.avgPe}</span>
                    </div>
                    <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute inset-0 w-full h-full flex">
                            <div className="w-[35%] bg-blue-400/80"></div>
                            <div className="w-[40%] bg-amber-400/80"></div>
                            <div className="w-[25%] bg-rose-400/80"></div>
                        </div>
                        <div className="absolute top-0 bottom-0 w-1.5 bg-slate-900 z-10 rounded-full ring-2 ring-white" style={{ left: getPos(valData.pe, valData.avgPe) }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold mt-2 px-0.5">
                        <span className="text-blue-600">Cheap</span>
                        <span className="text-amber-600">Fair</span>
                        <span className="text-rose-600">Exp.</span>
                    </div>
                </div>

                {/* P/B Ratio */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block tracking-wider">P/B RATIO</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-slate-800">{(valData.pb || 0).toFixed(1)}</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Avg: {valData.avgPb}</span>
                    </div>
                    <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 via-amber-400 to-rose-500 opacity-80"></div>
                        <div className="absolute top-0 bottom-0 w-1.5 bg-slate-900 z-10 rounded-full ring-2 ring-white" style={{ left: getPos(valData.pb, valData.avgPb) }}></div>
                    </div>
                </div>
            </div>
        </div>
    )
};

const GlobalPulse = () => {
    const [pulse, setPulse] = useState([]);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const res = await fetchMarketData({ limit: 9 });
                if (res && res.length > 0) {
                    const unique = [];
                    const seen = new Set();
                    for (const row of res) {
                        const key = String(row.symbol || row.name || '').toUpperCase();
                        if (!key || seen.has(key)) {
                            continue;
                        }
                        seen.add(key);
                        unique.push(row);
                        if (unique.length >= 9) {
                            break;
                        }
                    }

                    const mapped = unique.map(i => ({
                        name: i.symbol || i.name || 'ASSET',
                        val: Number.isFinite(Number(i.price)) && Number(i.price) > 0 ? Number(i.price).toLocaleString() : '--',
                        change: Number.isFinite(Number(i.change_24h ?? i.change))
                            ? `${Number(i.change_24h ?? i.change) >= 0 ? '▲' : '▼'} ${Math.abs(Number(i.change_24h ?? i.change)).toFixed(2)}%`
                            : '--',
                        changeDirection: Number.isFinite(Number(i.change_24h ?? i.change))
                            ? (Number(i.change_24h ?? i.change) >= 0 ? 'up' : 'down')
                            : 'flat',
                        code: inferRegionCode(i),
                    }));
                    setPulse(mapped);
                } else {
                    setPulse([]);
                }
            } catch (e) {
                console.error("Global Pulse fetch failed", e);
                setError(true);
                setPulse([]);
            } finally {
                setIsLoading(false);
            }
        }

        load();
        timer = setInterval(load, 30000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="investor-card p-6 h-full flex flex-col relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary-500 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">🌍</span>
                    <span className="text-xs font-bold text-rose-600">Global Markets Offline</span>
                </div>
            )}
            <div className="card-header mb-6">
                <h3 className="text-lg font-bold text-slate-800">Global Pulse</h3>
            </div>
            <div className="space-y-6 flex-1">
                {!isLoading && pulse.length === 0 && !error && (
                    <div className="text-xs text-slate-500 font-medium">No pulse data available from backend.</div>
                )}
                {pulse.map((m, i) => (
                    <div key={i} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-lg border border-slate-100 group-hover:bg-white transition-colors">
                                {countryFlag(m.code)}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-700">{displaySymbol(m.name)}</div>
                                <div className={`text-[10px] font-bold ${m.change.includes('▲') ? 'text-blue-500' : 'text-rose-500'}`}>{m.change}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="font-black text-sm text-slate-800 font-mono tracking-tight">{m.val}</div>
                            <svg className="w-12 h-4 opacity-30" viewBox="0 0 60 30">
                                <path
                                    d={m.spark}
                                    fill="none"
                                    stroke={m.change.includes('▲') ? '#3E84F6' : '#ef4444'}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const DiscoveryShelves = () => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const response = await fetchDiscoveryShelves();

                const buildRow = (title, desc, stocks, icon) => ({
                    title,
                    desc,
                    icon,
                    picks: (stocks || []).slice(0, 4).map((stock, index) => ({
                        id: `${title}-${index}`,
                        sym: stock.symbol || stock.ticker || 'NA',
                    })),
                });

                const liveSymbols = await fetchMarketData({ type: 'STOCK', limit: 12 });
                const momentumBasket = (Array.isArray(liveSymbols) ? liveSymbols : []).slice(0, 8);

                const next = [
                    buildRow('Stock Of The Week', 'Highlighted by current fundamentals', response?.stockOfTheWeek ? [response.stockOfTheWeek] : [], '⭐'),
                    buildRow('Dividend Leaders', 'Strong dividend profile', response?.topDividends, '📑'),
                    buildRow('Undervalued Gems', 'Lower valuation opportunities', response?.undervaluedGems, '💎'),
                    buildRow('Momentum Leaders', 'Top names by current market action', response?.momentumLeaders?.length ? response.momentumLeaders : momentumBasket, '🚀'),
                    buildRow('Most Active', 'Frequently traded names right now', momentumBasket, '🔥'),
                ].filter((item) => item.picks.length > 0);

                setItems(next);
            } catch (e) {
                console.error('Discovery shelves fetch failed:', e);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        load();
        timer = setInterval(load, 120000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="investor-card p-6 h-full relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">🧭</span>
                    <span className="text-xs font-bold text-rose-600">Discovery feed unavailable</span>
                </div>
            )}

            <div className="card-header mb-6">
                <h3 className="text-lg font-bold text-slate-800">Discovery Shelves</h3>
            </div>

            <div className="space-y-4">
                {items.length === 0 && !isLoading && !error && (
                    <div className="text-xs text-slate-500 font-medium">No discovery ideas available right now.</div>
                )}
                {items.map((item, i) => (
                    <div key={i} className="feature-item group hover:bg-blue-500/10 p-4 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="feature-icon bg-slate-500/10 group-hover:bg-white/10 p-2 rounded-lg w-12 h-12 flex items-center justify-center text-2xl shadow-sm">{item.icon}</div>
                                <div>
                                    <div className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</div>
                                    <div className="text-xs text-slate-500">{item.desc}</div>
                                </div>
                            </div>
                            <span className="text-gray-300 group-hover:text-blue-600 transition-colors">›</span>
                        </div>

                        <div className="bg-slate-500/10 rounded-lg p-2.5 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Picks</span>
                            <div className="h-4 w-px bg-slate-200"></div>
                            <div className="flex -space-x-2">
                                {item.picks.map((pick) => (
                                    <div key={pick.id} className="w-7 h-7 rounded-full bg-slate-800 text-white border-2 border-white flex items-center justify-center text-[8px] font-bold shadow-sm z-0 hover:z-10 hover:scale-110 transition-transform">
                                        {displaySymbol(pick.sym).substring(0, 1)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium ml-auto">{item.picks.map((pick) => displaySymbol(pick.sym)).join(', ')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SectorLandscape = () => {
    const [timeframe, setTimeframe] = useState('1Y');
    const [viewType, setViewType] = useState('BEST');
    const [data, setData] = useState([]);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);
    const chartTheme = {
        panel: 'from-white via-emerald-50/35 to-white',
        line: '#cbd5e1',
        grid: '#e2e8f0',
        xTick: '#334155',
        yTick: '#64748b',
        posLabel: '#059669',
        negLabel: '#dc2626',
        posGlow: '#86efac',
        negGlow: '#fda4af',
    };

    const formatPercent = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '0.0%';
        return `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}%`;
    };

    const mapSectorRows = (rows) => {
        return rows
            .map((row) => {
                const rawReturn = Number(row?.return);
                if (!Number.isFinite(rawReturn)) return null;
                return {
                    name: String(row?.sector || 'Unknown Sector'),
                    index: String(row?.index || 'Broad Market'),
                    realValue: Number(rawReturn.toFixed(2)),
                };
            })
            .filter(Boolean);
    };

    const buildSectorView = (rows) => {
        const normalized = mapSectorRows(rows);
        if (!normalized.length) return [];

        const directional = viewType === 'BEST'
            ? normalized.filter((row) => row.realValue >= 0)
            : normalized.filter((row) => row.realValue <= 0);

        const source = directional.length > 0 ? directional : normalized;
        const sorted = [...source].sort((a, b) => viewType === 'BEST' ? b.realValue - a.realValue : a.realValue - b.realValue);
        return sorted.slice(0, 7);
    };

    const SectorValueLabel = ({ x, y, width, height, value }) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return null;

        const labelX = Number(x) + Number(width) / 2;
        const labelY = numeric >= 0 ? Number(y) - 10 : Number(y) + Number(height) + 15;

        return (
            <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fill={numeric >= 0 ? chartTheme.posLabel : chartTheme.negLabel}
                fontSize={12}
                fontWeight={800}
            >
                {formatPercent(numeric)}
            </text>
        );
    };

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const tf = timeframe.toLowerCase();
                const res = await fetchSectorPerformance(tf);
                const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                setData(buildSectorView(rows));
            } catch (e) {
                console.error("Sector Landscape error:", e);
                setError(true);
                setData([]);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [timeframe, viewType, reloadToken]);

    const yExtent = Math.max(
        1,
        ...data.map((item) => Math.abs(Number(item.realValue) || 0))
    );
    const yPadding = Math.max(1.5, Number((yExtent * 0.18).toFixed(1)));
    const yDomain = [-(Math.ceil(yExtent + yPadding)), Math.ceil(yExtent + yPadding)];
    const breadth = data.reduce((acc, row) => {
        if (row.realValue > 0) acc.gainers += 1;
        if (row.realValue < 0) acc.losers += 1;
        return acc;
    }, { gainers: 0, losers: 0 });
    const averageReturn = data.length
        ? Number((data.reduce((sum, row) => sum + row.realValue, 0) / data.length).toFixed(2))
        : 0;

    return (
        <div className={`investor-card p-6 col-span-2 flex flex-col h-full relative overflow-hidden bg-gradient-to-br ${chartTheme.panel} border border-emerald-100/70`}>
            <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl"></div>
            <div className="pointer-events-none absolute -bottom-16 -right-20 h-52 w-52 rounded-full bg-amber-200/20 blur-3xl"></div>
            {isLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-3xl mb-3">📊</span>
                    <span className="text-sm font-bold text-rose-600">Sector Performance Unavailable</span>
                    <button onClick={() => setTimeframe(timeframe)} className="mt-4 text-xs bg-white/60 border border-current px-4 py-2 rounded-lg text-rose-600 font-bold hover:bg-rose-50 transition-colors uppercase tracking-wider">Reload Sectors</button>
                </div>
            )}
            <div className="card-header relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h3 className="text-lg font-black tracking-wide text-slate-800">Sector Landscape</h3>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5 uppercase tracking-[0.12em]">Relative performance by sector index</p>
                    </div>

                    <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
                        <button
                            onClick={() => setViewType('BEST')}
                            className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold tracking-wide ${viewType === 'BEST' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Best Performing"
                        >
                            <span className="inline-flex items-center gap-1"><TrendingUp size={14} /> Best</span>
                        </button>
                        <button
                            onClick={() => setViewType('WORST')}
                            className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold tracking-wide ${viewType === 'WORST' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Worst Performing"
                        >
                            <span className="inline-flex items-center gap-1"><TrendingDown size={14} /> Worst</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['1D', '1W', '1M', '3M', '6M', '1Y'].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-bold ${timeframe === tf ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white/10 border border-slate-200/50 text-slate-600 hover:bg-slate-500/10'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 mb-3 flex flex-wrap gap-2">
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-500/10 border border-emerald-200 px-2.5 py-1 rounded-full">Avg {timeframe}: {formatPercent(averageReturn)}</span>
                <span className="text-[11px] font-black text-slate-700 bg-slate-500/10 border border-slate-200 px-2.5 py-1 rounded-full">Gainers: {breadth.gainers}</span>
                <span className="text-[11px] font-black text-rose-700 bg-rose-500/10 border border-rose-200 px-2.5 py-1 rounded-full">Losers: {breadth.losers}</span>
            </div>

            <div className="relative z-10 w-full mt-2 flex-1 min-h-[340px]">
                {!isLoading && !error && data.length === 0 ? (
                    <div className="h-full w-full rounded-xl border border-slate-200 bg-white/10 flex items-center justify-center text-center px-6">
                        <div>
                            <p className="text-sm font-bold text-slate-700">No sector data from backend</p>
                            <p className="text-xs text-slate-500 mt-1">Try a different timeframe or refresh once sector service is available.</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 24, right: 18, left: 8, bottom: 20 }} barCategoryGap="14%">
                            <defs>
                                <linearGradient id="sectorBestGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#34D399" stopOpacity={0.88} />
                                </linearGradient>
                                <linearGradient id="sectorWorstGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#FB7185" stopOpacity={0.9} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                            <ReferenceLine y={0} stroke={chartTheme.line} strokeWidth={1.25} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: chartTheme.xTick, fontSize: 12, fontWeight: 700 }}
                            />
                            <YAxis
                                domain={yDomain}
                                allowDataOverflow={false}
                                axisLine={false}
                                tickLine={false}
                                width={36}
                                tick={{ fill: chartTheme.yTick, fontSize: 11, fontWeight: 700 }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                cursor={false}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 12px 30px -20px rgba(15,23,42,0.55)', background: '#FFFFFF' }}
                                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                labelStyle={{ color: '#475569', fontWeight: 700 }}
                                formatter={(_value, _name, props) => [formatPercent(props.payload.realValue), `${props.payload.name} (${props.payload.index})`]}
                                labelFormatter={() => `${timeframe} performance`}
                            />
                            <Bar
                                dataKey="realValue"
                                radius={[4, 4, 4, 4]}
                                fill={viewType === 'BEST' ? 'url(#sectorBestGradient)' : 'url(#sectorWorstGradient)'}
                                maxBarSize={72}
                                style={{ filter: `drop-shadow(0 0 8px ${viewType === 'BEST' ? chartTheme.posGlow : chartTheme.negGlow})` }}
                            >
                                <LabelList
                                    dataKey="realValue"
                                    content={(props) => <SectorValueLabel {...props} />}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="relative z-10 mt-3 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-700">Mapped Sector Indices:</span>
                {data.slice(0, 4).map((item) => (
                    <span key={item.name}>{item.name}: <span className="font-bold text-slate-700">{item.index}</span></span>
                ))}
            </div>
        </div>
    );
};

const EconomicCalendar = () => {
    const [events, setEvents] = useState([
        { id: 1, time: '10:00', country: 'IN', event: 'CPI Inflation', impact: 'High', actual: '-', forecast: '5.1%' },
        { id: 2, time: '12:30', country: 'US', event: 'Retail Sales', impact: 'Medium', actual: '-', forecast: '0.4%' },
        { id: 3, time: '15:00', country: 'EU', event: 'ECB Statement', impact: 'High', actual: '-', forecast: '-' },
    ]);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const res = await fetchEconomicCalendar();
                if (res && res.length > 0) {
                    setEvents(
                        res.slice(0, 8).map((event, index) => ({
                            id: event.id || index + 1,
                            time: event.time || event.date || '-',
                            country: event.country || 'US',
                            event: event.event || event.title || 'Economic Event',
                            impact: event.impact || 'Medium',
                            actual: event.actual || '-',
                            forecast: event.forecast || event.previous || '-',
                        }))
                    );
                } else {
                    setEvents([
                        { id: 1, time: '10:00', country: 'IN', event: 'CPI Inflation', impact: 'High', actual: '-', forecast: '5.1%' },
                        { id: 2, time: '12:30', country: 'US', event: 'Retail Sales', impact: 'Medium', actual: '-', forecast: '0.4%' },
                        { id: 3, time: '15:00', country: 'EU', event: 'ECB Statement', impact: 'High', actual: '-', forecast: '-' },
                    ]);
                }
            } catch (e) {
                console.error("Eco Calendar fetch error:", e);
                setError(true);
                setEvents([
                    { id: 1, time: '10:00', country: 'IN', event: 'CPI Inflation', impact: 'High', actual: '-', forecast: '5.1%' },
                    { id: 2, time: '12:30', country: 'US', event: 'Retail Sales', impact: 'Medium', actual: '-', forecast: '0.4%' },
                    { id: 3, time: '15:00', country: 'EU', event: 'ECB Statement', impact: 'High', actual: '-', forecast: '-' },
                ]);
            } finally {
                setIsLoading(false);
            }
        }

        load();
        timer = setInterval(load, 300000);
        return () => clearInterval(timer);
    }, []);

    const impactTone = (impact) => {
        const value = String(impact || '').toLowerCase();
        if (value === 'high') return 'text-rose-600 bg-rose-50 border-rose-100';
        if (value === 'medium') return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-blue-600 bg-blue-50 border-blue-100';
    };

    const eventCountryFlag = (code) => {
        const upper = String(code || '').toUpperCase();
        if (upper === 'US') return '🇺🇸';
        if (upper === 'UK' || upper === 'GB') return '🇬🇧';
        if (upper === 'EU') return '🇪🇺';
        if (upper === 'JP') return '🇯🇵';
        return '🇮🇳';
    };

    return (
        <div className="investor-card p-4 h-full flex flex-col relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">📅</span>
                    <span className="text-xs font-bold text-rose-600">Calendar Error</span>
                </div>
            )}
            <div className="card-header mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Economic Calendar</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Macro Pulse · High-impact events watchlist</p>
                </div>
                <div className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-1">{events.length} events</div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {events.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-500/10 border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 border border-slate-200 flex items-center justify-center text-sm font-bold" title={e.country}>
                                {eventCountryFlag(e.country)}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-800 line-clamp-1">{e.event}</div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>{e.time}</span>
                                    <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${impactTone(e.impact)}`}>{e.impact}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-black text-slate-800">{e.actual || '-'}</div>
                            <div className="text-[10px] text-slate-400">Est: {e.forecast || '-'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrendingThemes = () => {
    const [risingThemes, setRisingThemes] = useState([]);
    const [fallingThemes, setFallingThemes] = useState([]);

    useEffect(() => {
        let timer;

        const load = async () => {
            try {
                const response = await fetchSectorPerformance('1w');
                const rows = Array.isArray(response?.data) ? response.data : [];

                const normalized = rows.map((sector) => ({
                    name: sector.sector,
                    value: Number(sector.return) || 0,
                }));

                const rising = normalized
                    .filter((item) => item.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)
                    .map((item, index) => ({
                        ...item,
                        trend: `+${item.value.toFixed(1)}% wk`,
                        icon: ['📈', '⚡', '🧠'][index % 3],
                    }));

                const falling = normalized
                    .filter((item) => item.value < 0)
                    .sort((a, b) => a.value - b.value)
                    .slice(0, 3)
                    .map((item, index) => ({
                        ...item,
                        trend: `${item.value.toFixed(1)}% wk`,
                        icon: ['📉', '🧊', '🛰️'][index % 3],
                    }));

                setRisingThemes(rising.length ? rising : FALLBACK_THEME_ROWS.rising);
                setFallingThemes(falling.length ? falling : FALLBACK_THEME_ROWS.falling);
            } catch (error) {
                console.error('Trending themes fetch failed:', error);
                setRisingThemes(FALLBACK_THEME_ROWS.rising);
                setFallingThemes(FALLBACK_THEME_ROWS.falling);
            }
        };

        load();
        timer = setInterval(load, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="investor-card p-4 h-full flex flex-col">
            <div className="card-header mb-3 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Trending Themes</h3>
                <TrendingUp size={16} className="text-blue-500" />
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-600" />
                            <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider">Rising Themes</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-bold">Top Gainers</span>
                    </div>
                    <div className="space-y-1.5">
                        {risingThemes.length === 0 && <div className="text-xs text-slate-500">No rising themes right now.</div>}
                        {risingThemes.map((theme, i) => (
                            <div key={`${theme.name}-${i}`} className="group relative flex items-center justify-between rounded-lg px-2 py-1.5 pl-3 hover:bg-white/70 transition-colors">
                                <span className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-full bg-blue-500 opacity-0 transition-all duration-200 group-hover:h-4 group-hover:opacity-100"></span>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-base">{theme.icon}</span>
                                    <span className="text-xs font-bold text-slate-700">{theme.name}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[11px] font-black text-blue-600">{theme.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingDown size={14} className="text-rose-600" />
                            <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider">Falling Themes</span>
                        </div>
                        <span className="text-[10px] text-rose-600 font-bold">Top Decliners</span>
                    </div>
                    <div className="space-y-1.5">
                        {fallingThemes.length === 0 && <div className="text-xs text-slate-500">No falling themes right now.</div>}
                        {fallingThemes.map((theme, i) => (
                            <div key={`${theme.name}-${i}`} className="group relative flex items-center justify-between rounded-lg px-2 py-1.5 pl-3 hover:bg-white/70 transition-colors">
                                <span className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-full bg-rose-500 opacity-0 transition-all duration-200 group-hover:h-4 group-hover:opacity-100"></span>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-base">{theme.icon}</span>
                                    <span className="text-xs font-bold text-slate-700">{theme.name}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[11px] font-black text-rose-600">{theme.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// News Tab has been extracted to InvestorNewsDashboard component

// News Tab logic has been moved to src/components/investor/InvestorNewsDashboard.jsx


// Helper components for the dashboard

const InvestorNewsFeed = () => {
    const [news, setNews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const data = await fetchMarketNews();
                setNews(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("News load failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="dashboard-layout fade-in bg-transparent w-full px-4 md:px-10 py-6">
            <div className="main-content-area transition-all duration-300 w-full mb-10">
                <div className="mb-8">
                    <h1 className="text-[34px] font-black text-[#1e293b] tracking-tight mb-2">Market News</h1>
                    <p className="text-[#64748b] font-semibold text-[15px]">The latest financial updates and market-moving headlines.</p>
                </div>

                <div className="space-y-4 max-w-5xl">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-20">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : news.length > 0 ? (
                        news.map((item, i) => (
                            <div key={i} className="investor-card p-6 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.source || 'Market News'}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{item.time || 'Today'}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">{item.headline || item.title}</h3>
                                {item.summary && <p className="text-sm text-slate-500 line-clamp-2">{item.summary}</p>}
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-20 text-slate-400 font-bold">No news available at the moment.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper components for the dashboard

function InvestorView({ activeModule }) {
    if (activeModule === 'WATCHLIST') {
        return <Watchlist />;
    }

    if (activeModule === 'SCREENERS') {
        return <Screeners />;
    }

    if (activeModule === 'NEWS') {
        return <InvestorNewsFeed />;
    }

    // Default: DASHBOARD
    return (
        <div className="dashboard-layout fade-in bg-transparent transition-all duration-500 py-4 w-full px-4 md:px-10">
            <div className="main-content-area transition-all duration-300 w-full">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-[34px] font-black text-[#1e293b] tracking-tight drop-shadow-sm">Welcome back, Captain.</h1>
                        <p className="text-[#64748b] font-semibold text-[15px]">At a glance overview of your portfolio and the global market pulse.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1 mb-4">
                    <MarketMoodGauge />
                    <ValuationThermometer />
                    <YourInvestments />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                        <MostBoughtStocks />
                    </div>
                    <div className="md:col-span-1">
                        <GlobalPulse />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                        <DiscoveryShelves />
                    </div>
                    <div className="md:col-span-2">
                        <SectorLandscape />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div className="md:col-span-1">
                        <EconomicCalendar />
                    </div>
                    <div className="md:col-span-1">
                        <TrendingThemes />
                    </div>
                </div>
            </div>
        </div>
    );
}
