import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  ComposedChart,
  Bar,
  Line,
} from "recharts";
import {
  Search,
  Bell,
  LogOut,
  LayoutDashboard,
  Star,
  Filter,
  Newspaper,
  ChevronUp,
  ChevronDown,
  Activity,
  TrendingUp,
  User,
  HelpCircle,
  Settings,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tilt } from "react-tilt";
import MarketTicker from "../components/dashboard/MarketTicker";
import InvestorView from "./InvestorDashboard";
import TraderView from "./TraderDashboard";
import { mockStock, topMovers, chartDataByTimeframe, priceData, candlestickData, mockNews, dominanceData, COLORS, defaultTiltOptions, mockNotifications } from "./dashboardData";
import "./Dashboard.css";


// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export default function Dashboard() {
  const navigate = useNavigate();
  const [isTraderMode, setIsTraderMode] = useState(
    localStorage.getItem("mode") === "TRADER"
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userInitial, setUserInitial] = useState("U");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeModule, setActiveModule] = useState("DASHBOARD");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const email = localStorage.getItem("email");
    const name = user
      ? JSON.parse(user).name
      : email
        ? email.split("@")[0]
        : "User";
    setUserInitial(name.charAt(0).toUpperCase());
  }, []);

  useEffect(() => {
    if (!isTraderMode) {
      document.body.style.backgroundColor = "#FBF7F2";
      document.body.style.backgroundImage = "none";
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
    };
  }, [isTraderMode]);

  const toggleMode = () => {
    const newMode = !isTraderMode;
    localStorage.setItem("mode", newMode ? "TRADER" : "INVESTOR");
    if (newMode) {
      // Switching TO trader — show preloader first
      setIsProfileOpen(false);
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTraderMode(true);
        setIsTransitioning(false);
      }, 2200);
    } else {
      setIsTraderMode(false);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userMode");
    localStorage.removeItem("mode");
    navigate("/", { state: { skipPreloader: true } });
  };

  return (
    <div
      className={`dashboard-container ${isTraderMode ? "trader-theme" : "investor-theme"
        }`}
    >
      {/* ── Preloader overlay when switching to Trader mode ── */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="mode-preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
            className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-[#00f3ff]/5 rounded-full blur-[100px] animate-pulse" />
              <div className="absolute bottom-[20%] right-[20%] w-[30vw] h-[30vw] bg-purple-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[#00f3ff]/20 blur-3xl rounded-full"
                />
                <div className="relative p-1 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-[#00f3ff]/20 shadow-2xl backdrop-blur-md">
                  <img src="/radar-logo-final.jpg" alt="Radar" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
                </div>
              </motion.div>
              <div className="text-center space-y-3">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-4xl md:text-5xl font-black text-white tracking-tighter"
                >
                  RADAR
                </motion.h1>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent"
                />
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-xs md:text-sm text-[#00f3ff] font-bold tracking-[0.3em] uppercase"
                >
                  Switching to Trader Mode
                </motion.p>
              </div>
              <div className="w-32 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent w-1/2 h-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isTraderMode && (
        <>
          <header className="navbar trader-glass-bar sticky top-0 z-50 px-6 mb-6">
            <div className="max-w-[1920px] mx-auto w-full flex items-center justify-between">
              {/* Left: Brand & Nav */}
              <div className="flex items-center gap-10">
                <a href="/" className="brand flex items-center gap-3">
                  <img
                    src="/radar-logo-final.jpg"
                    alt="Radar Logo"
                    className="w-8 h-8 rounded-full shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                  />
                  <span className="brand-name text-lg font-bold tracking-widest text-white">
                    RADAR
                  </span>
                </a>

                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center gap-2">
                  {[
                    { id: "DASHBOARD", icon: LayoutDashboard, label: "Dashboard" },
                    { id: "WATCHLIST", icon: Star, label: "Watchlist" },
                    { id: "SCREENERS", icon: Filter, label: "Screeners" },
                    { id: "NEWS", icon: Newspaper, label: "News" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`nav-link flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeModule === item.id
                        ? isTraderMode
                          ? "bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                          : "bg-blue-50 text-blue-600"
                        : isTraderMode
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Right: Search & Actions */}
              <div className="flex items-center gap-6">
                <div className="relative group w-64 hidden xl:block">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f3ff] transition-colors">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search markets..."
                    className="navbar-search w-full border rounded-full py-2 pl-9 pr-4 text-xs text-white focus:outline-none transition-all placeholder:text-gray-500"
                    style={{ background: '#141923', borderColor: '#00F3FF', boxShadow: '0 0 8px rgba(0,243,255,0.15)' }}
                  />
                </div>

                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                  {/* Notification Bell */}
                  <div className="relative cursor-pointer group" ref={notifRef}>
                    <button
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
                    >
                      <Bell size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse shadow-[0_0_8px_#00f3ff]"></span>
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationsOpen && (
                      <div className="absolute right-0 top-11 w-80 rounded-xl shadow-2xl border border-white/10 py-2 backdrop-blur-xl z-[100] origin-top-right"
                        style={{ background: '#0B0F17' }}>
                        {/* Header */}
                        <div className="px-4 py-2 border-b border-white/10 flex justify-between items-center">
                          <h3 className="font-bold text-sm text-white">Notifications</h3>
                          <span className="text-xs text-[#00f3ff] cursor-pointer hover:text-[#00f3ff]/70 transition-colors">Mark read</span>
                        </div>

                        {/* List */}
                        <div className="max-h-64 overflow-y-auto">
                          {mockNotifications.map(n => (
                            <div
                              key={n.id}
                              className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex gap-3 transition-colors"
                            >
                              <div className="mt-0.5 flex-shrink-0">
                                <CheckCircle size={14} className="text-[#00f3ff]" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[#E5E7EB]">{n.text}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{n.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 text-center text-xs text-gray-500 cursor-pointer hover:text-[#3db26b] transition-colors">
                          View all activity
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <div
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#bc13fe] flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-lg hover:scale-105 transition-transform"
                    >
                      {userInitial}
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-72 bg-[#0b0e14] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                        {/* User Info Header */}
                        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#bc13fe] flex items-center justify-center text-base font-bold text-white shadow-lg">
                            {userInitial}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Current User</p>
                            <p className="text-xs text-gray-500">{localStorage.getItem('email') || 'user@radar.com'}</p>
                          </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="py-2">
                          <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <User size={16} /> My Profile
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <Settings size={16} /> Settings
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <HelpCircle size={16} /> Help &amp; Support
                          </button>
                        </div>

                        {/* Mode Toggle Slider Section */}
                        <div className="border-t border-b border-white/10 py-3 px-4 bg-black/20">
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-3 text-center text-gray-500">
                            Choose Your Interface
                          </div>

                          <div
                            className="relative w-full h-12 rounded-full cursor-pointer flex items-center p-1.5 transition-all duration-300 shadow-inner group bg-black/40 border border-white/10"
                            onClick={toggleMode}
                          >
                            {/* Active Slider Indicator */}
                            <div
                              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform translate-x-full bg-[#161c27] border border-[#00f3ff]/30"
                            >
                            </div>

                            {/* Investor Label */}
                            <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full opacity-60 hover:opacity-100 transition-opacity">
                              <Activity size={16} className="text-gray-400" />
                              <span className="text-xs font-bold text-gray-400">Investor</span>
                            </div>

                            {/* Trader Label */}
                            <div className="w-1/2 flex items-center justify-center relative z-10 gap-2 h-full">
                              <TrendingUp size={16} className="text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]" />
                              <span className="text-xs font-bold text-[#00f3ff]">Trader</span>
                            </div>
                          </div>
                        </div>

                        {/* Logout Section */}
                        <div className="pt-1 pb-1 bg-[#0b0e14]">
                          <button
                            onClick={() => { setIsProfileOpen(false); setShowLogoutModal(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group"
                          >
                            <LogOut size={16} className="text-red-400 group-hover:text-red-300" />
                            <span className="text-sm text-red-400 group-hover:text-red-300 font-medium">
                              Sign Out
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>
          {activeModule === "DASHBOARD" && (
            <div className="mb-0">
              <MarketTicker />
            </div>
          )}
        </>
      )}

      <main className="content fade-in transition-all duration-300 w-full">
        {isTraderMode ? (
          <TraderView data={mockStock} activeModule={activeModule} />
        ) : (
          <InvestorView
            data={mockStock}
            movers={topMovers}
            activeModule={activeModule}
            onToggleMode={toggleMode}
          />
        )}
      </main>

      {/* Trader Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: '#0B0F17', border: '1px solid rgba(0,243,255,0.15)' }}
          >
            <div className="text-center">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(0,243,255,0.08)', color: '#00f3ff', boxShadow: '0 0 24px rgba(0,243,255,0.15)' }}
              >
                <LogOut size={32} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div
                  className="text-xl font-bold mb-2"
                  style={{ color: '#ffffff', textTransform: 'none', letterSpacing: 'normal', textAlign: 'center' }}
                >
                  Signing Out?
                </div>
                <p className="text-sm mb-8" style={{ color: '#9CA3AF', textAlign: 'center' }}>
                  Ready to sign off, Trader? The market sleeps for no one!
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ background: 'rgba(0,243,255,0.08)', color: '#00f3ff', border: '1px solid rgba(0,243,255,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,243,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,243,255,0.08)'}
                >
                  No, Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl font-bold text-[#020617] transition-all"
                  style={{ background: '#00f3ff', boxShadow: '0 4px 20px rgba(0,243,255,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,243,255,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,243,255,0.3)'}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}