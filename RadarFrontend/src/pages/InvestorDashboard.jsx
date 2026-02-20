import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MarketTicker from "../components/dashboard/MarketTicker";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
    LabelList,
} from "recharts";
import { Search, Maximize2, Settings, Pin, Bell, Menu, X, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign, Activity, LogOut, LayoutDashboard, Star, Filter, Newspaper, ChevronRight, ChevronLeft, User, CreditCard, HelpCircle, CheckCircle } from "lucide-react";
import Preloader from '../components/common/Preloader';

import { Tilt } from "react-tilt";
import { motion } from "framer-motion";
import "./InvestorDashboard.css";
import MostBoughtStocks from '../components/investor/MostBoughtStocks';
import YourInvestments from '../components/investor/YourInvestments';

const mockStock = {
    symbol: "BTC",
    name: "Bitcoin",
    price: "42,500.00",
    change: "+5.2%",
    high: "43,000",
    low: "41,200",
    volume: "24B",
    marketCap: "800B",
};

const priceData = [
    { time: "10:00", price: 41200 },
    { time: "11:00", price: 41800 },
    { time: "12:00", price: 42500 },
    { time: "13:00", price: 42100 },
    { time: "14:00", price: 43000 },
    { time: "15:00", price: 42800 },
    { time: "16:00", price: 43200 },
    { time: "17:00", price: 42900 },
];

const topMovers = [
    { symbol: "SOL", name: "Solana", change: "+12.5%", price: "$98.20" },
    { symbol: "AVAX", name: "Avalanche", change: "+8.1%", price: "$34.50" },
    { symbol: "ETH", name: "Ethereum", change: "+4.2%", price: "$2,250" },
];

const mockNews = [
    {
        id: 1,
        source: "CoinDesk",
        title: "Bitcoin Surges Past $92k Amid ETF Optimism",
        time: "2h ago",
        sentiment: "Bullish",
    },
    {
        id: 2,
        source: "Bloomberg",
        title: "Global Markets Rally as Inflation Data Cools",
        time: "4h ago",
        sentiment: "Neutral",
    },
    {
        id: 3,
        source: "CryptoSlate",
        title: "Miners Holding Onto BTC Despite Price Volatility",
        time: "6h ago",
        sentiment: "Bullish",
    },
];

const dominanceData = [
    { name: "BTC", value: 52 },
    { name: "ETH", value: 17 },
    { name: "Others", value: 31 },
];

const COLORS = ["#00f3ff", "#bc13fe", "#0aff68"];

const defaultTiltOptions = {
    reverse: false,
    max: 15,
    perspective: 1000,
    scale: 1.02,
    speed: 1000,
    transition: true,
    axis: null,
    reset: true,
    easing: "cubic-bezier(.03,.98,.52,.99)",
};

export default function InvestorMode({ onToggleMode }) {
    const navigate = useNavigate();
    // isTraderMode removed, defaulting to Investor behavior
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [userInitial, setUserInitial] = useState("U");

    useEffect(() => {
        const user = localStorage.getItem("user");
        const email = localStorage.getItem("email");
        // Fallback logic to get initial
        const name = user ? JSON.parse(user).name : (email ? email.split('@')[0] : "User");
        setUserInitial(name.charAt(0).toUpperCase());
    }, []);

    // Sync Body Background - Forced Investor Theme
    useEffect(() => {
        document.body.style.backgroundColor = '#FBF7F2'; // Investor Beige
        document.body.style.backgroundImage = 'none';
        return () => {
            document.body.style.backgroundColor = '';
            document.body.style.backgroundImage = '';
        };
    }, []);

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Mock Notifications
    const mockNotifications = [
        { id: 1, text: "BTC broken resistance at $44k", time: "2m ago", read: false },
        { id: 2, text: "New Feature: Options Chain live", time: "1h ago", read: false },
        { id: 3, text: "Margin Call Warning: 80% usage", time: "3h ago", read: true },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userMode");
        localStorage.removeItem("mode");
        navigate("/", { state: { skipPreloader: true } });
    };

    const [activeModule, setActiveModule] = useState("DASHBOARD");

    return (
        <div className="dashboard-container investor-theme">
            <header className="navbar mb-6">
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

                {/* Navigation Links */}
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

                {/* Global Search Bar (Pushed to Right) */}
                <div className="hidden xl:flex ml-auto mr-8 relative group">
                    <div className="relative w-80">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(16, 185, 129, 0.5)' }}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search stocks..."
                            className="w-full rounded-full py-2.5 pl-12 pr-4 text-xs font-semibold focus:outline-none transition-all bg-white border border-emerald-100/50 text-emerald-900 focus:border-emerald-500 focus:shadow-sm placeholder:text-emerald-300"
                        />
                    </div>
                </div>

                {/* Mode Toggle Removed - Moved to Menu */}

                <div className="nav-buttons flex items-center gap-5 mr-2">
                    {/* Notification Bell */}
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
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                        </button>


                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-12 w-80 rounded-xl shadow-2xl border py-2 backdrop-blur-xl z-[100] transform origin-top-right transition-all bg-[#FBF7F2]/95 border-[#1F3D2B]/10">
                                <div className="px-4 py-2 border-b border-gray-700/50 flex justify-between items-center">
                                    <h3 className="font-bold text-sm text-[#1F3D2B]">Notifications</h3>
                                    <span className="text-xs text-[#00f3ff] cursor-pointer">Mark read</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {mockNotifications.map(n => (
                                        <div key={n.id} className={`px-4 py-3 border-b border-gray-700/30 hover:bg-gray-700/20 cursor-pointer flex gap-3 ${!n.read ? 'bg-blue-500/5' : ''}`}>
                                            <div className="mt-1"><CheckCircle size={14} className={n.read ? "text-gray-500" : "text-[#00f3ff]"} /></div>
                                            <div>
                                                <p className="text-xs font-semibold text-[#1F3D2B]">{n.text}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">{n.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-2 text-center text-xs text-gray-500 cursor-pointer hover:text-[#00f3ff]">View all activity</div>
                            </div>
                        )}
                    </div>

                    {/* Profile Avatar */}
                    <div className="relative">
                        <div
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="profile-avatar shadow-emerald-500/20 hover:scale-105 transition-transform"
                        >
                            {userInitial}
                        </div>


                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-12 w-72 rounded-xl shadow-2xl border py-2 backdrop-blur-xl z-[100] transform origin-top-right transition-all bg-white border-[#1F3D2B]/10">

                                {/* User Info */}
                                <div className="px-4 py-4 border-b border-gray-700/50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-bold text-white">
                                        {userInitial}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1F3D2B]">Current User</p>
                                        <p className="text-xs text-gray-500">user@radar.com</p>
                                    </div>
                                </div>

                                {/* Navigation Links (Moved Top) */}
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

                                {/* Mode Toggle Slider */}
                                <div className="border-t border-b border-gray-700/50 py-3 px-4">
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-3 text-center text-[#1F3D2B]/60">
                                        Choose Your Interface
                                    </div>

                                    <div
                                        className="relative w-full h-12 rounded-full cursor-pointer flex items-center p-1.5 transition-all duration-300 shadow-inner group bg-[#FBF7F2] border border-[#1F3D2B]/10"
                                        onClick={onToggleMode}
                                    >
                                        {/* Active Slider Indicator */}
                                        <div
                                            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform translate-x-0 bg-white border border-[#1F3D2B]/10 shadow-sm"
                                        >
                                        </div>

                                        {/* Investor Label */}
                                        <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full">
                                            <Activity size={16} className="text-[#1F3D2B] scale-110 drop-shadow-sm" />
                                            <span className="text-xs font-bold text-[#1F3D2B]">Investor</span>
                                        </div>

                                        {/* Trader Label */}
                                        <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full opacity-60 hover:opacity-100 transition-opacity">
                                            <TrendingUp size={16} className="text-gray-400 group-hover:text-gray-600" />
                                            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600">Trader</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logout Section */}
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

            <div className="px-8 mb-6">
                <TickerTape />
            </div>

            <main className="content fade-in transition-all duration-300">
                <InvestorView data={mockStock} movers={topMovers} activeModule={activeModule} />
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 fade-in">
                    <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all scale-100 bg-[#FBF7F2] border border-[#1F3D2B]/10">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50 text-red-500">
                                <LogOut size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-[#1F3D2B]">Signing Out?</h3>
                            <p className="text-sm mb-8 text-[#1F3D2B]/60">
                                Ready to sign off, Captain? The market sleeps for no one!
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold transition-all bg-[#1F3D2B]/5 text-[#1F3D2B] hover:bg-[#1F3D2B]/10"
                                >
                                    No, Stay
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-lg hover:shadow-red-500/30 transition-all"
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

// --- New Components for Refined Dashboard ---



const TickerTape = () => {
    const items = [
        { sym: "NIFTY", val: "18,500", chg: "-0.35%", down: true },
        { sym: "SENSEX", val: "62,300", chg: "-0.29%", down: true },
        { sym: "S&P 500", val: "4,300", chg: "+0.40%", down: false },
        { sym: "FTSE", val: "7,620", chg: "0.00%", neutral: true },
        { sym: "NIKKEI", val: "32,900", chg: "-0.20%", down: true },
        { sym: "NASDAQ", val: "13,200", chg: "+0.80%", down: false },
        { sym: "GOLD", val: "1,950", chg: "+0.15%", down: false },
        { sym: "CRUDE", val: "72.5", chg: "-1.2%", down: true },
    ];

    return (
        <div
            className="w-full relative overflow-hidden py-3 select-none"
            style={{
                maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
            }}
        >
            {/* Scrolling Content */}
            <div className="flex gap-16 w-max animate-marquee hover:[animation-play-state:paused] items-center">
                {[...items, ...items, ...items].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-bold text-[#1F3D2B]/60 tracking-widest">{item.sym}</span>
                            <span className="text-sm font-black text-[#1F3D2B] font-mono">{item.val}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.neutral ? 'bg-slate-200 text-slate-600' :
                            item.down ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                            } `}>
                            <span>{item.down ? '▼' : item.neutral ? '•' : '▲'}</span>
                            <span>{item.chg}</span>
                        </div>
                        {/* Separator */}
                        <div className="h-4 w-px bg-slate-300/50 ml-8 skew-x-12"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MarketMoodGauge = () => {
    const score = 72; // Mock score
    const needleRotation = (score / 100) * 180 - 90; // Map 0-100 to -90 to 90 degrees

    return (
        <div className="investor-card p-6 h-full flex flex-col justify-between relative overflow-hidden group">
            {/* Decorative Background Blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-all duration-500"></div>

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
                {/* SVG Gauge */}
                <svg viewBox="0 0 200 110" className="w-full h-full">
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" /> {/* Red - Fear */}
                            <stop offset="50%" stopColor="#eab308" /> {/* Yellow - Neutral */}
                            <stop offset="100%" stopColor="#22c55e" /> {/* Green - Greed */}
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Background Arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />

                    {/* Colored Arc */}
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

                {/* Pivot Point */}
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

const ValuationThermometer = () => (
    <div className="investor-card p-6 h-full flex flex-col relative overflow-hidden">
        <div className="card-header flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Valuation Check</h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">NIFTY 50</span>
        </div>

        <div className="space-y-8 flex-1">
            {/* P/E Ratio Meter */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 block tracking-wider">P/E RATIO</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-800">22.4</span>
                            <span className="text-[10px] text-slate-400 font-medium">(Elevated)</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Avg: 20.1</span>
                </div>
                <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute inset-0 w-full h-full flex">
                        <div className="w-[35%] bg-emerald-400/80"></div>
                        <div className="w-[40%] bg-amber-400/80"></div>
                        <div className="w-[25%] bg-rose-400/80"></div>
                    </div>
                    <div className="absolute top-0 bottom-0 w-1.5 bg-slate-900 z-10 rounded-full ring-2 ring-white" style={{ left: '72%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold mt-2 px-0.5">
                    <span className="text-emerald-600">Cheap</span>
                    <span className="text-amber-600">Fair</span>
                    <span className="text-rose-600">Exp.</span>
                </div>
            </div>

            {/* P/B Ratio Meter */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 block tracking-wider">P/B RATIO</span>
                        <span className="text-xl font-black text-slate-800">4.1</span>
                    </div>
                </div>
                <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 opacity-80"></div>
                    <div className="absolute top-0 bottom-0 w-1.5 bg-slate-900 z-10 rounded-full ring-2 ring-white" style={{ left: '85%' }}></div>
                </div>
            </div>
        </div>
    </div>
);

const GlobalPulse = () => (
    <div className="investor-card p-6 h-full flex flex-col">
        <div className="card-header mb-6">
            <h3 className="text-lg font-bold text-slate-800">Global Pulse</h3>
        </div>
        <div className="space-y-6 flex-1">
            {[
                { name: "S&P 500", val: "4,300", change: "▲ 0.4%", code: "US", spark: "M0 10 Q 15 0, 30 15 T 60 10" },
                { name: "FTSE", val: "7,620", change: "▲ 0.0%", code: "UK", spark: "M0 15 Q 15 15, 30 15 T 60 15" },
                { name: "NIKKEI", val: "32,900", change: "▼ 0.2%", code: "JP", spark: "M0 5 Q 15 20, 30 5 T 60 20" }
            ].map((m, i) => (
                <div key={i} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-lg border border-slate-100 group-hover:bg-white transition-colors">
                            {m.code === 'US' ? '🇺🇸' : m.code === 'UK' ? '🇬🇧' : '🇯🇵'}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-slate-700">{m.name}</div>
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
);

const DiscoveryShelves = () => (
    <div className="investor-card p-6 h-full">
        <div className="card-header mb-6">
            <h3 className="text-lg font-bold text-slate-800">Discovery "Shelves"</h3>
        </div>
        <div className="space-y-4">
            {[
                {
                    title: "Buffettology",
                    desc: "High ROE, Low Debt, Consistent Margins",
                    icon: "👓",
                    picks: [
                        { id: '1', sym: 'BRK', color: 'bg-blue-900 text-white' },
                        { id: '2', sym: 'KO', color: 'bg-red-600 text-white' },
                        { id: '3', sym: 'AXP', color: 'bg-cyan-600 text-white' }
                    ]
                },
                {
                    title: "Dividend Aristocrats",
                    desc: "Increasing dividends for > 5 years",
                    icon: "👑",
                    picks: [
                        { id: '1', sym: 'JNJ', color: 'bg-red-500 text-white' },
                        { id: '2', sym: 'PG', color: 'bg-blue-800 text-white' },
                        { id: '3', sym: 'PEP', color: 'bg-blue-600 text-white' }
                    ]
                },
                {
                    title: "Undervalued Giants",
                    desc: "Blue-chip stocks near 52-week lows",
                    icon: "🐘",
                    picks: [
                        { id: '1', sym: 'PFE', color: 'bg-blue-500 text-white' },
                        { id: '2', sym: 'VZ', color: 'bg-black text-white' },
                        { id: '3', sym: 'T', color: 'bg-blue-400 text-white' }
                    ]
                },
                {
                    title: "Growth at Reasonable Price",
                    desc: "PEG Ratio < 1",
                    icon: "🚀",
                    picks: [
                        { id: '1', sym: 'GOOG', color: 'bg-green-600 text-white' },
                        { id: '2', sym: 'META', color: 'bg-blue-700 text-white' },
                        { id: '3', sym: 'PYPL', color: 'bg-blue-800 text-white' }
                    ]
                },
            ].map((item, i) => (
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

                    {/* Top Picks Window */}
                    <div className="bg-slate-100/50 rounded-lg p-2.5 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Picks</span>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <div className="flex -space-x-2">
                            {item.picks.map((pick) => (
                                <div key={pick.id} className={`w-7 h-7 rounded-full ${pick.color} border-2 border-white flex items-center justify-center text-[8px] font-bold shadow-sm z-0 hover:z-10 hover:scale-110 transition-transform`}>
                                    {pick.sym.substring(0, 1)}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium ml-auto">+{Math.floor(Math.random() * 10) + 3} more</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


const SectorLandscape = () => {
    const [timeframe, setTimeframe] = useState('1Y');
    const [viewType, setViewType] = useState('BEST'); // 'BEST' or 'WORST'
    const [data, setData] = useState([]);

    // Mock Data Generator
    const generateData = (type, time) => {
        // Extended list for more variety
        const sectors = ['Auto', 'IT', 'Banks', 'Pharma', 'FMCG', 'Metals', 'Energy', 'Infra', 'Real Estate', 'Media', 'Telco'];

        // Scale factors based on timeframe
        const scaleMap = {
            '1M': { min: 1, max: 5 },
            '3M': { min: 3, max: 12 },
            '6M': { min: 8, max: 20 },
            '1Y': { min: 15, max: 40 },
            '3Y': { min: 40, max: 100 },
            '5Y': { min: 80, max: 200 }
        };

        const range = scaleMap[time] || scaleMap['1Y'];

        return sectors.map((sector, index) => {
            // Deterministic generation based on sector name length and index to keep it constant per session
            // but different between sectors.
            const seed = sector.length * (index + 2);

            let randomFactor = (seed % 100) / 100; // Pseudo-random 0-1

            // Base value within the range
            let baseValue = range.min + (randomFactor * (range.max - range.min));

            // Direction based on viewType
            let finalValue = type === 'BEST' ? baseValue : -baseValue;

            // Add slight variation so not all are sorted perfectly by index
            finalValue += (index % 2 === 0 ? 1 : -1) * (baseValue * 0.1);

            return {
                name: sector,
                chartValue: Math.abs(parseFloat(finalValue.toFixed(1))),
                realValue: parseFloat(finalValue.toFixed(1))
            };
        }).sort((a, b) => type === 'BEST' ? b.chartValue - a.chartValue : b.chartValue - a.chartValue).slice(0, 7);
    };

    // Initial Load & Update on Timeframe Change
    useEffect(() => {
        setData(generateData(viewType, timeframe));
    }, [timeframe, viewType]);

    const color = viewType === 'BEST' ? "#10b981" : "#ef4444"; // Emerald or Red

    return (
        <div className="investor-card p-6 col-span-2 flex flex-col h-full">
            <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-800">Sector Landscape</h3>

                    {/* View Toggles */}
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

                {/* Timeframe Controls */}
                <div className="flex flex-wrap gap-2">
                    {['1M', '3M', '6M', '1Y', '3Y', '5Y'].map((tf) => (
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

            <div className="w-full h-[550px] mt-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap="5%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis hide />
                        <Tooltip
                            cursor={false}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                            formatter={(value, name, props) => [`${props.payload.realValue > 0 ? '+' : ''}${props.payload.realValue}% `, props.payload.name]}
                        />
                        <Bar dataKey="chartValue" fill={color} radius={[4, 4, 0, 0]}>
                            <LabelList
                                dataKey="realValue"
                                position="top"
                                fill={color}
                                fontSize={12}
                                fontWeight="bold"
                                formatter={(val) => `${val > 0 ? '+' : ''}${val}% `}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const EconomicCalendar = () => {
    const events = [
        { id: 1, time: "18:00", country: "🇺🇸", event: "Initial Jobless Claims", impact: "High", actual: "212K", forecast: "215K" },
        { id: 2, time: "20:15", country: "🇪🇺", event: "ECB Press Conference", impact: "High", actual: "-", forecast: "-" },
        { id: 3, time: "21:30", country: "🇺🇸", event: "Existing Home Sales", impact: "Medium", actual: "3.89M", forecast: "3.91M" }
    ];

    return (
        <div className="investor-card p-6 h-full flex flex-col">
            <div className="card-header mb-6">
                <h3 className="text-lg font-bold text-slate-800">Economic Calendar</h3>
            </div>
            <div className="space-y-4 flex-1">
                {events.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{e.country}</span>
                            <div>
                                <div className="text-xs font-bold text-slate-800 line-clamp-1">{e.event}</div>
                                <div className="text-[10px] text-slate-500">{e.time} • Impact: <span className={e.impact === 'High' ? 'text-rose-500 font-bold' : 'text-amber-500 font-bold'}>{e.impact}</span></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-black text-slate-800">{e.actual}</div>
                            <div className="text-[10px] text-slate-400">Est: {e.forecast}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrendingThemes = () => {
    const themes = [
        { name: "AI Infrastructure", trend: "+24% wk", icon: "🤖", color: "text-purple-500" },
        { name: "Renewable Energy", trend: "+8% wk", icon: "🌱", color: "text-emerald-500" },
        { name: "Electric Vehicles", trend: "-3% wk", icon: "⚡", color: "text-amber-500" },
        { name: "Global Logistics", trend: "+5% wk", icon: "🚢", color: "text-blue-500" }
    ];

    return (
        <div className="investor-card p-6 h-full flex flex-col">
            <div className="card-header mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Trending Themes</h3>
                <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="grid grid-cols-1 gap-3 flex-1">
                {themes.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{t.icon}</span>
                            <span className="text-xs font-bold text-slate-700">{t.name}</span>
                        </div>
                        <span className={`text-[10px] font-black ${t.trend.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{t.trend}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Investor Components ---
// (InvestorView is kept, TraderView and its widgets are removed)

function InvestorView({ data, movers, activeModule }) {
    if (activeModule && activeModule !== 'DASHBOARD') {
        return (
            <div className="dashboard-layout fade-in flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">{activeModule}</h2>
                    <p className="text-slate-500">Module under development.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout fade-in" style={{ backgroundColor: '#FBF7F2' }}>
            <div className="main-content-area transition-all duration-300">
                {/* Top Ticker was moved to InvestorMode */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-6">
                    <MarketMoodGauge />
                    <ValuationThermometer />
                    <YourInvestments />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <MostBoughtStocks />
                    </div>
                    <div className="md:col-span-1">
                        <GlobalPulse />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-1">
                        <DiscoveryShelves />
                    </div>
                    <div className="md:col-span-2">
                        <SectorLandscape />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1">
                        <EconomicCalendar />
                    </div>
                    <div className="md:col-span-1">
                        <TrendingThemes />
                    </div>
                    <div className="md:col-span-1">
                        {/* Placeholder for future specific data or advertisement shelf */}
                        <div className="investor-card p-6 h-full flex items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/30">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">More Analytics Coming Soon</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Sparkline = ({ data, color }) => (
    <div style={{ width: 60, height: 30 }}>
        <ResponsiveContainer minWidth={0} minHeight={0}>
            <AreaChart data={data}>
                <Area type="monotone" dataKey="price" stroke={color} fill="none" strokeWidth={2} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);
