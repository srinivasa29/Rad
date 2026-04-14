import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    LogOut,
    Menu,
} from "lucide-react";
import { useHeaderData } from "../../hooks/useHeaderData";
import { fetchMarketData, fetchTrendingSearches, logSearchQuery } from "../../api/marketApi";
import { updateUserMode } from "../../api/userApi";

const displaySymbol = (value) => String(value || '').replace(/\.(NS|BO)$/i, '');

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

const Header = ({ activeModule, setActiveModule, onToggleMode }) => {
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

    useEffect(() => {
        let isMounted = true;
        const loadTrending = async () => {
            const trends = await fetchTrendingSearches();
            if (isMounted) setTrendingSearches(trends.slice(0, 6));
        };
        loadTrending();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const query = searchQuery.trim();
        if (!query) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await fetchMarketData({ search: query });
                if (isMounted) setSearchResults(Array.isArray(response) ? response.slice(0, 8) : []);
            } catch (error) {
                if (isMounted) setSearchResults([]);
            } finally {
                if (isMounted) setIsSearching(false);
            }
        }, 250);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [searchQuery]);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSearchDropdown(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const openStockPage = (value) => {
        const symbol = String(value || '').trim();
        if (!symbol) return;
        const mode = localStorage.getItem('mode') || 'INVESTOR';
        const path = mode === 'INVESTOR' ? '/investor-stock/' : '/stocks/';
        navigate(`${path}${encodeURIComponent(symbol.toUpperCase())}`);
    };

    const handleSearchSelect = async (item) => {
        const label = item?.symbol || item?.name || '';
        setSearchQuery(label);
        setShowSearchDropdown(false);
        if (setActiveModule) setActiveModule('WATCHLIST');
        openStockPage(label);
        if (label) await logSearchQuery(label);
    };

    const handleTrendingSelect = async (term) => {
        setSearchQuery(term);
        setShowSearchDropdown(false);
        if (setActiveModule) setActiveModule('WATCHLIST');
        openStockPage(term);
        await logSearchQuery(term);
    };

    return (
        <>
            <header className="navbar rounded-2xl mx-6 lg:mx-10 border border-white/40 shadow-xl relative z-[110] bg-white/60 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
                {/* Left Side: Logo & Brand */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#3E84F6]/10 flex items-center justify-center border border-[#3E84F6]/20 overflow-hidden shadow-inner">
                        <img src="/radar-logo-final.jpg" alt="Radar Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="brand-name font-black tracking-tighter text-xl text-[#3E84F6]">RADAR</span>
                </div>

                {/* Center: Navigation Links */}
                <div className="hidden lg:flex items-center gap-8 ml-8">
                    {[
                        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'WATCHLIST', label: 'Watchlist', icon: Star },
                        { id: 'SCREENERS', label: 'Screeners', icon: Filter },
                        { id: 'NEWS', label: 'News', icon: Newspaper }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveModule ? setActiveModule(item.id) : navigate('/dashboard?module=' + item.id)}
                            className={`flex items-center gap-2 text-sm font-black tracking-tight transition-all duration-300 ${activeModule === item.id ? 'scale-110 opacity-100' : 'opacity-100 hover:scale-105'}`}
                            style={{ color: '#3E84F6' }}
                        >
                            <item.icon size={18} strokeWidth={2.5} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Right Side: Search & Actions */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    {/* Compact Search Bar */}
                    <div className="relative hidden md:block max-w-[280px] w-full" ref={searchContainerRef}>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(62, 132, 246, 0.5)' }}>
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search stocks..."
                            value={searchQuery}
                            onFocus={() => setShowSearchDropdown(true)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={async (e) => {
                                const usingSearchResults = searchQuery.trim().length > 0;
                                const optionsLength = usingSearchResults ? searchResults.length : trendingSearches.length;
                                if (e.key === 'ArrowDown' && optionsLength > 0) {
                                    e.preventDefault();
                                    setHighlightedIndex((prev) => (prev + 1) % optionsLength);
                                } else if (e.key === 'ArrowUp' && optionsLength > 0) {
                                    e.preventDefault();
                                    setHighlightedIndex((prev) => (prev - 1 + optionsLength) % optionsLength);
                                } else if (e.key === 'Enter') {
                                    if (usingSearchResults && searchResults.length > 0) {
                                        await handleSearchSelect(searchResults[Math.max(0, highlightedIndex)]);
                                    } else if (!usingSearchResults && trendingSearches.length > 0) {
                                        await handleTrendingSelect(trendingSearches[Math.max(0, highlightedIndex)]);
                                    }
                                }
                            }}
                            className="w-full rounded-full py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none transition-all bg-white border border-blue-100/50 text-blue-900 focus:border-[#3E84F6] focus:shadow-sm placeholder:text-blue-300"
                        />
                        {showSearchDropdown && (
                            <div className="absolute top-11 left-0 right-0 bg-white border border-blue-100 rounded-xl shadow-xl overflow-hidden z-[120]">
                                {isSearching ? (
                                    <div className="px-4 py-3 text-xs font-semibold text-slate-500">Searching...</div>
                                ) : searchQuery.trim().length > 0 ? (
                                    searchResults.map((item, idx) => (
                                        <button key={idx} onClick={() => handleSearchSelect(item)} className={`w-full text-left px-4 py-3 border-b border-blue-50 ${highlightedIndex === idx ? 'bg-blue-50' : 'hover:bg-blue-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-slate-800">{displaySymbol(item.symbol)}</p>
                                                    <p className="text-[10px] text-slate-500">{item.name}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-[#3E84F6]">{item.type}</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Trending</p>
                                        <div className="flex flex-wrap gap-2">
                                            {trendingSearches.map((term, idx) => (
                                                <button key={idx} onClick={() => handleTrendingSelect(term)} className={`px-2 py-1 rounded-full text-[10px] font-bold ${highlightedIndex === idx ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notification & Profile Buttons */}
                    <div className="flex items-center gap-2 border-l border-blue-100/30 pl-4">
                        <div className="relative" onMouseEnter={() => setIsNotificationsOpen(true)} onMouseLeave={() => setIsNotificationsOpen(false)}>
                            <button className="relative w-9 h-9 flex items-center justify-center hover:bg-blue-50 rounded-full text-[#3E84F6]">
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-rose-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-1">{unreadCount}</span>}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-0 top-10 w-80 bg-white border border-blue-100 rounded-xl shadow-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-1">
                                    <div className="px-4 py-2 border-b flex justify-between items-center bg-blue-50/50">
                                        <h3 className="font-bold text-xs text-blue-900">Notifications</h3>
                                        <button onClick={markAllNotificationsRead} className="text-[10px] font-bold text-blue-600 hover:underline">Mark read</button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length > 0 ? notifications.map((n, i) => (
                                            <div key={i} className="px-4 py-3 border-b border-blue-50 hover:bg-blue-50 flex gap-3">
                                                <CheckCircle size={14} className={n.read ? "text-slate-300" : "text-blue-500"} />
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-semibold text-slate-800 leading-tight">{n.title || n.message}</p>
                                                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">{formatNotificationTime(n.createdAt)}</p>
                                                </div>
                                            </div>
                                        )) : <div className="p-8 text-center text-xs text-slate-400">No new notifications</div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-9 h-9 rounded-full bg-[#3E84F6] text-white flex items-center justify-center text-xs font-black cursor-pointer hover:scale-110 transition-all shadow-lg shadow-blue-500/20">
                                {userInitial}
                            </div>
                            {isProfileOpen && (
                                <div className="absolute right-0 top-11 w-64 bg-white border border-blue-100 rounded-xl shadow-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-1">
                                    <div className="px-4 py-3 border-b bg-blue-50/50">
                                        <p className="text-xs font-bold text-blue-900">{profile?.username || 'User'}</p>
                                        <p className="text-[10px] text-blue-600/70 font-medium truncate">{profile?.email || 'user@radar.com'}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 transition-colors">
                                            <User size={16} /> My Profile
                                        </Link>
                                        
                                        {/* Premium Mode Switcher */}
                                        <div className="border-t border-b border-blue-50 py-3 px-4 bg-blue-50/20 my-1">
                                            <div className="text-[10px] font-black uppercase tracking-wider mb-2 text-center text-blue-400">
                                                Choose Your Interface
                                            </div>

                                            <div 
                                                className="relative w-full h-10 rounded-full cursor-pointer flex items-center p-1 transition-all duration-300 shadow-inner group bg-slate-100 border border-slate-200"
                                                onClick={() => {
                                                    localStorage.setItem('mode', 'TRADER');
                                                    if (onToggleMode) onToggleMode();
                                                    setIsProfileOpen(false);
                                                }}
                                            >
                                                {/* Animated Slide Background */}
                                                <div 
                                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform bg-white border border-slate-200 translate-x-0`}
                                                ></div>

                                                {/* Mode Options */}
                                                <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full">
                                                    <Activity size={14} className="text-blue-600" />
                                                    <span className="text-[11px] font-black text-blue-600">Investor</span>
                                                </div>

                                                <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full opacity-50 hover:opacity-100 transition-opacity">
                                                    <TrendingUp size={14} className="text-slate-500" />
                                                    <span className="text-[11px] font-black text-slate-500">Trader</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-1">
                                            <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors">
                                                <LogOut size={16} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {showLogoutModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><LogOut size={32} /></div>
                        <h3 className="text-xl font-bold mb-2">Sign Out?</h3>
                        <p className="text-sm text-slate-500 mb-6">Are you sure you want to log out of RADAR?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                            <button onClick={handleLogout} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold">Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
