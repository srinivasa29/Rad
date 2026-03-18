import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import YourInvestments from '../components/investor/YourInvestments';
import MostBoughtStocks from '../components/investor/MostBoughtStocks';
import SharedTickerTape from '../components/landing/TickerTape';

import { LayoutDashboard, Star, Filter, Newspaper, Search, Bell, CheckCircle, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

import "./InvestorDashboard.css";
import { fetchDiscoveryShelves, fetchMarketMood, fetchValuation } from "../api/fundamentalApi";
import { fetchSectorPerformance, fetchMarketData, fetchTrendingSearches, logSearchQuery } from "../api/marketApi";
import { fetchEconomicCalendar } from "../api/calendarApi";
import { updateUserMode } from "../api/userApi";
import { useHeaderData } from "../hooks/useHeaderData";
import { BarChart, Bar, XAxis, CartesianGrid, YAxis, Tooltip, LabelList, ResponsiveContainer, ReferenceLine } from "recharts";

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

const FALLBACK_SECTOR_ROWS = [
    { sector: 'Financial Services', index: 'NIFTY FIN SERVICE', return: 2.1 },
    { sector: 'Information Technology', index: 'NIFTY IT', return: 1.6 },
    { sector: 'Auto', index: 'NIFTY AUTO', return: 1.2 },
    { sector: 'FMCG', index: 'NIFTY FMCG', return: -0.4 },
    { sector: 'Realty', index: 'NIFTY REALTY', return: -1.1 },
    { sector: 'Metal', index: 'NIFTY METAL', return: -1.4 },
];

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

export default function InvestorMode({ onToggleMode }) {
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
        document.body.style.backgroundColor = '#FBF7F2';
        document.body.style.backgroundImage = 'none';
        return () => {
            document.body.style.backgroundColor = '';
            document.body.style.backgroundImage = '';
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

    const handleSearchSelect = async (item) => {
        const label = item?.symbol || item?.name || '';
        setSearchQuery(label);
        setShowSearchDropdown(false);
        setHighlightedIndex(-1);
        setActiveModule('WATCHLIST');

        if (label) {
            await logSearchQuery(label);
        }
    };

    const handleTrendingSelect = async (term) => {
        setSearchQuery(term);
        setShowSearchDropdown(false);
        setHighlightedIndex(-1);
        setActiveModule('WATCHLIST');
        await logSearchQuery(term);
    };

    return (
        <div className="dashboard-container investor-theme">
            <header className="navbar">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 overflow-hidden shadow-inner">
                        <img
                            src="/radar-logo-final.jpg"
                            alt="Radar Logo"
                            className="w-full h-full object-cover scale-100"
                        />
                    </div>
                    <span className="brand-name font-black tracking-tighter text-2xl" style={{ color: '#10B981' }}>RADAR</span>
                </div>

                {}
                <div className="hidden lg:flex items-center gap-10 ml-12">
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
                            style={{ color: '#10B981' }}
                        >
                            <item.icon size={18} strokeWidth={2.5} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {}
                <div className="hidden xl:flex ml-auto mr-8 relative group" ref={searchContainerRef}>
                    <div className="relative w-80">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(16, 185, 129, 0.5)' }}>
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
                            className="w-full rounded-full py-2.5 pl-12 pr-4 text-xs font-semibold focus:outline-none transition-all bg-white border border-emerald-100/50 text-emerald-900 focus:border-emerald-500 focus:shadow-sm placeholder:text-emerald-300"
                        />

                        {showSearchDropdown && (
                            <div className="absolute top-12 left-0 right-0 bg-white border border-emerald-100 rounded-2xl shadow-xl overflow-hidden z-[120]">
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
                                                className={`w-full text-left px-4 py-3 transition-colors border-b border-emerald-50 ${highlightedIndex >= 0 && searchResults[highlightedIndex] === item ? 'bg-emerald-50' : 'hover:bg-emerald-50'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800">{displaySymbol(item.symbol)}</p>
                                                        <p className="text-[11px] text-slate-500">{item.name}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-600">{item.type}</span>
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
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors ${highlightedIndex >= 0 && trendingSearches[highlightedIndex] === term ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
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

                {}

                <div className="nav-buttons flex items-center gap-5 mr-2">
                    {}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsNotificationsOpen(true)}
                        onMouseLeave={() => setIsNotificationsOpen(false)}
                    >
                        <button
                            className="transition-all duration-200 relative w-10 h-10 flex items-center justify-center hover:bg-emerald-50 rounded-full"
                            style={{ color: '#10B981' }}
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
                                        className="text-xs text-[#10B981] disabled:text-gray-400 hover:text-emerald-700 transition-colors"
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
                                                <div className="mt-1"><CheckCircle size={14} className={notification.read ? "text-gray-400" : "text-[#10B981]"} /></div>
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
                                <div className="px-4 py-2 text-center text-xs text-gray-500 cursor-pointer hover:text-[#10B981] transition-colors">View all activity</div>
                            </div>
                        )}
                    </div>

                    {}
                    <div className="relative">
                        <div
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="profile-avatar shadow-emerald-500/20 hover:scale-105 transition-transform"
                        >
                            {userInitial}
                        </div>


                        {}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-12 w-72 rounded-xl shadow-2xl border py-2 backdrop-blur-xl z-[100] transform origin-top-right transition-all bg-white border-[#1F3D2B]/10">

                                {}
                                <div className="px-4 py-4 border-b border-gray-700/50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-bold text-white">
                                        {userInitial}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1F3D2B]">{profile?.username || 'Current User'}</p>
                                        <p className="text-xs text-gray-500">{profile?.email || localStorage.getItem('email') || 'user@radar.com'}</p>
                                    </div>
                                </div>

                                {}
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

                                {}
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
                                        {}
                                        <div
                                            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform translate-x-0 bg-white border border-[#1F3D2B]/10 shadow-sm"
                                        >
                                        </div>

                                        {}
                                        <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full">
                                            <Activity size={16} className="text-[#1F3D2B] scale-110 drop-shadow-sm" />
                                            <span className="text-xs font-bold text-[#1F3D2B]">Investor</span>
                                        </div>

                                        {}
                                        <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full opacity-60 hover:opacity-100 transition-opacity">
                                            <TrendingUp size={16} className="text-gray-400 group-hover:text-gray-600" />
                                            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600">Trader</span>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="pt-2 pb-1">
                                    <button
                                        onClick={() => { setIsProfileOpen(false); setShowLogoutModal(true); }}
                                        className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-[#18bc79] hover:bg-[#18bc79]/10"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {activeModule === "DASHBOARD" && (
                <div className="px-4 mb-1">
                    <SharedTickerTape variant="investor" />
                </div>
            )}

            <main className="content fade-in transition-all duration-300">
                <InvestorView activeModule={activeModule} />
            </main>

            {}
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
}



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
            {}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-all duration-500"></div>

            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-rose-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">📡</span>
                    <span className="text-xs font-bold text-rose-600">Mood Sensor Offline</span>
                    <button onClick={() => window.location.reload()} className="mt-3 text-[10px] bg-rose-100 px-3 py-1 rounded text-rose-600 font-bold hover:bg-rose-200">RETRY</button>
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
                {}
                <svg viewBox="0 0 200 110" className="w-full h-full">
                    {}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" /> {}
                            <stop offset="50%" stopColor="#eab308" /> {}
                            <stop offset="100%" stopColor="#22c55e" /> {}
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />

                    {}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="20" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="0" filter="url(#glow)" />

                    {}
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

                {}
                <div
                    className="absolute bottom-2 left-1/2 w-1 h-24 bg-slate-800 origin-bottom rounded-full transition-transform duration-1000 ease-out z-10"
                    style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rounded-full"></div>
                </div>

                {}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-slate-800 rounded-full border-4 border-white shadow-lg z-20"></div>

                {}
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
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-rose-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">📉</span>
                    <span className="text-xs font-bold text-rose-600">Valuation Data Unavailable</span>
                </div>
            )}
            <div className="card-header flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Valuation Check</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{VALUATION_BENCHMARK_BY_REGION[DEFAULT_REGION] || VALUATION_BENCHMARK_BY_REGION.IN}</span>
            </div>

            <div className="space-y-8 flex-1">
                {}
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
                            <div className="w-[35%] bg-emerald-400/80"></div>
                            <div className="w-[40%] bg-amber-400/80"></div>
                            <div className="w-[25%] bg-rose-400/80"></div>
                        </div>
                        <div className="absolute top-0 bottom-0 w-1.5 bg-slate-900 z-10 rounded-full ring-2 ring-white" style={{ left: getPos(valData.pe, valData.avgPe) }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold mt-2 px-0.5">
                        <span className="text-emerald-600">Cheap</span>
                        <span className="text-amber-600">Fair</span>
                        <span className="text-rose-600">Exp.</span>
                    </div>
                </div>

                {}
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
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 opacity-80"></div>
                        <div className="absolute top-0 bottom-0 w-1.5 bg-slate-900 z-10 rounded-full ring-2 ring-white" style={{ left: getPos(valData.pb, valData.avgPb) }}></div>
                    </div>
                </div>
            </div>
        </div>
    )
};

const GlobalPulse = () => {
    const [pulse, setPulse] = useState([
        { name: "S&P 500", val: "4,300", change: "▲ 0.4%", code: "US", spark: "M0 10 Q 15 0, 30 15 T 60 10" },
        { name: "FTSE", val: "7,620", change: "▲ 0.0%", code: "UK", spark: "M0 15 Q 15 15, 30 15 T 60 15" },
        { name: "NIKKEI", val: "32,900", change: "▼ 0.2%", code: "JP", spark: "M0 5 Q 15 20, 30 5 T 60 20" }
    ]);
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

                    setPulse(unique.map(i => ({
                        name: i.symbol || i.name || 'ASSET',
                        val: Number(i.price || 0).toLocaleString(),
                        change: `${Number(i.change_24h || i.change || 0) >= 0 ? '▲' : '▼'} ${Math.abs(Number(i.change_24h || i.change || 0)).toFixed(2)}%`,
                        code: inferRegionCode(i),
                        spark: "M0 10 Q 15 0, 30 15 T 60 10"
                    })));
                }
            } catch (e) {
                console.error("Global Pulse fetch failed", e);
                setError(true);
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
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-rose-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xl mb-2">🌍</span>
                    <span className="text-xs font-bold text-rose-600">Global Markets Offline</span>
                </div>
            )}
            <div className="card-header mb-6">
                <h3 className="text-lg font-bold text-slate-800">Global Pulse</h3>
            </div>
            <div className="space-y-6 flex-1">
                {pulse.map((m, i) => (
                    <div key={i} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-lg border border-slate-100 group-hover:bg-white transition-colors">
                                {countryFlag(m.code)}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-700">{displaySymbol(m.name)}</div>
                                <div className={`text-[10px] font-bold ${m.change.includes('▲') ? 'text-emerald-500' : 'text-rose-500'}`}>{m.change}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="font-black text-sm text-slate-800 font-mono tracking-tight">{m.val}</div>
                            <svg className="w-12 h-4 opacity-30" viewBox="0 0 60 30">
                                <path
                                    d={m.spark}
                                    fill="none"
                                    stroke={m.change.includes('▲') ? '#10b981' : '#ef4444'}
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
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-rose-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4">
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
                    <div key={i} className="feature-item group hover:bg-slate-50 p-4 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="feature-icon bg-slate-100 group-hover:bg-white p-2 rounded-lg w-12 h-12 flex items-center justify-center text-2xl shadow-sm">{item.icon}</div>
                                <div>
                                    <div className="font-bold text-base text-slate-800 group-hover:text-[#18bc79] transition-colors">{item.title}</div>
                                    <div className="text-xs text-slate-500">{item.desc}</div>
                                </div>
                            </div>
                            <span className="text-gray-300 group-hover:text-[#18bc79] transition-colors">›</span>
                        </div>

                        <div className="bg-slate-100/50 rounded-lg p-2.5 flex items-center gap-3">
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

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const tf = timeframe.toLowerCase();
                const res = await fetchSectorPerformance(tf);
                const rows = Array.isArray(res?.data) ? res.data : [];
                if (rows.length > 0) {
                    const directionalRows = viewType === 'BEST'
                        ? rows.filter((row) => Number(row.return) >= 0)
                        : rows.filter((row) => Number(row.return) <= 0);

                    const source = directionalRows.length >= 4 ? directionalRows : rows;
                    let sorted = [...source];
                    if (viewType === 'BEST') {
                        sorted.sort((a, b) => b.return - a.return);
                    } else {
                        sorted.sort((a, b) => a.return - b.return);
                    }

                    setData(sorted.slice(0, 7).map(s => ({
                        name: s.sector,
                        index: s.index || 'Broad Market',
                        realValue: parseFloat(Number(s.return).toFixed(1))
                    })));
                } else {
                    const fallbackDirectional = viewType === 'BEST'
                        ? FALLBACK_SECTOR_ROWS.filter((row) => Number(row.return) >= 0)
                        : FALLBACK_SECTOR_ROWS.filter((row) => Number(row.return) <= 0);
                    const fallbackSource = fallbackDirectional.length ? fallbackDirectional : FALLBACK_SECTOR_ROWS;
                    const fallbackSorted = [...fallbackSource].sort((a, b) => viewType === 'BEST' ? b.return - a.return : a.return - b.return);
                    setData(fallbackSorted.slice(0, 7).map(s => ({
                        name: s.sector,
                        index: s.index || 'Broad Market',
                        realValue: parseFloat(Number(s.return).toFixed(1))
                    })));
                }
            } catch (e) {
                console.error("Sector Landscape error:", e);
                setError(true);
                const fallbackDirectional = viewType === 'BEST'
                    ? FALLBACK_SECTOR_ROWS.filter((row) => Number(row.return) >= 0)
                    : FALLBACK_SECTOR_ROWS.filter((row) => Number(row.return) <= 0);
                const fallbackSource = fallbackDirectional.length ? fallbackDirectional : FALLBACK_SECTOR_ROWS;
                const fallbackSorted = [...fallbackSource].sort((a, b) => viewType === 'BEST' ? b.return - a.return : a.return - b.return);
                setData(fallbackSorted.slice(0, 7).map(s => ({
                    name: s.sector,
                    index: s.index || 'Broad Market',
                    realValue: parseFloat(Number(s.return).toFixed(1))
                })));
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [timeframe, viewType]);

    const yExtent = Math.max(
        1,
        ...data.map((item) => Math.abs(Number(item.realValue) || 0))
    );
    const yDomain = [-(Math.ceil(yExtent) + 0.5), Math.ceil(yExtent) + 0.5];

    return (
        <div className="investor-card p-6 col-span-2 flex flex-col h-full relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-rose-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-3xl mb-3">📊</span>
                    <span className="text-sm font-bold text-rose-600">Sector Performance Unavailable</span>
                    <button onClick={() => setTimeframe(timeframe)} className="mt-4 text-xs bg-rose-100 px-4 py-2 rounded text-rose-600 font-bold hover:bg-rose-200 transition-colors">Reload Sectors</button>
                </div>
            )}
            <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-800">Sector Landscape</h3>

                    {}
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setViewType('BEST')}
                            className={`p-1.5 rounded-md transition-all ${viewType === 'BEST' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Best Performing"
                        >
                            <TrendingUp size={16} />
                        </button>
                        <button
                            onClick={() => setViewType('WORST')}
                            className={`p-1.5 rounded-md transition-all ${viewType === 'WORST' ? 'bg-white shadow text-red-500' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Worst Performing"
                        >
                            <TrendingDown size={16} />
                        </button>
                    </div>
                </div>

                {}
                <div className="flex flex-wrap gap-2">
                    {['1D', '1W', '1M', '3M', '6M', '1Y'].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`text-xs px-2.5 py-1 rounded transition-colors ${timeframe === tf ? 'bg-[#1F3D2B] text-[#FBF7F2] font-bold shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full mt-2 flex-1 min-h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barCategoryGap="14%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                            domain={yDomain}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            cursor={false}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                            formatter={(_value, _name, props) => [`${props.payload.realValue > 0 ? '+' : ''}${props.payload.realValue}%`, `${props.payload.name} (${props.payload.index})`]}
                            labelFormatter={() => `${timeframe} performance`}
                        />
                        <Bar
                            dataKey="realValue"
                            radius={[4, 4, 4, 4]}
                            fill={viewType === 'BEST' ? '#10b981' : '#ef4444'}
                        >
                            <LabelList
                                dataKey="realValue"
                                position={viewType === 'BEST' ? 'top' : 'insideBottom'}
                                fill={viewType === 'BEST' ? '#059669' : '#dc2626'}
                                fontSize={12}
                                fontWeight="bold"
                                formatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-600">Mapped Sector Indices:</span>
                {data.slice(0, 4).map((item) => (
                    <span key={item.name}>{item.name}: <span className="font-semibold text-slate-700">{item.index}</span></span>
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
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
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
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-rose-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4">
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
                    <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold" title={e.country}>
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
                <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-600" />
                            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Rising Themes</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold">Top Gainers</span>
                    </div>
                    <div className="space-y-1.5">
                        {risingThemes.length === 0 && <div className="text-xs text-slate-500">No rising themes right now.</div>}
                        {risingThemes.map((theme, i) => (
                            <div key={`${theme.name}-${i}`} className="group relative flex items-center justify-between rounded-lg px-2 py-1.5 pl-3 hover:bg-white/70 transition-colors">
                                <span className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-full bg-emerald-500 opacity-0 transition-all duration-200 group-hover:h-4 group-hover:opacity-100"></span>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-base">{theme.icon}</span>
                                    <span className="text-xs font-bold text-slate-700">{theme.name}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[11px] font-black text-emerald-600">{theme.trend}</span>
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

function InvestorView({ activeModule }) {
    if (activeModule === 'WATCHLIST') {
        return (
            <div className="dashboard-layout fade-in" style={{ backgroundColor: '#FBF7F2' }}>
                <div className="main-content-area transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1 mb-4">
                        <YourInvestments />
                        <MostBoughtStocks />
                        <GlobalPulse />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <SectorLandscape />
                        </div>
                        <div className="md:col-span-1">
                            <EconomicCalendar />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeModule === 'SCREENERS') {
        return (
            <div className="dashboard-layout fade-in" style={{ backgroundColor: '#FBF7F2' }}>
                <div className="main-content-area transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1 mb-4">
                        <MarketMoodGauge />
                        <ValuationThermometer />
                        <TrendingThemes />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <SectorLandscape />
                        </div>
                        <div className="md:col-span-1">
                            <DiscoveryShelves />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeModule === 'NEWS') {
        return (
            <div className="dashboard-layout fade-in" style={{ backgroundColor: '#FBF7F2' }}>
                <div className="main-content-area transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1 mb-4">
                        <div className="md:col-span-2">
                            <EconomicCalendar />
                        </div>
                        <div className="md:col-span-1">
                            <TrendingThemes />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-1">
                            <GlobalPulse />
                        </div>
                        <div className="md:col-span-2">
                            <SectorLandscape />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout fade-in" style={{ backgroundColor: '#FBF7F2' }}>
            <div className="main-content-area transition-all duration-300">
                {}

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

