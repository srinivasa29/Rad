import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";
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
    setIsTraderMode(newMode);
    localStorage.setItem("mode", newMode ? "TRADER" : "INVESTOR");
  };

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
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00f3ff] transition-colors">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search markets..."
                    className="navbar-search w-full bg-black/30 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#00f3ff]/50 focus:shadow-[0_0_15px_rgba(0,243,255,0.1)] transition-all placeholder:text-gray-600"
                  />
                </div>

                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                  <div className="relative cursor-pointer group">
                    <Bell
                      size={20}
                      className="text-gray-400 group-hover:text-white transition-colors"
                    />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00f3ff] rounded-full animate-pulse shadow-[0_0_8px_#00f3ff]"></span>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
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
                            <HelpCircle size={16} /> Help & Support
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
                        <div className="pt-1 pb-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/10 transition-colors group"
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
          <div className="mb-6">
            <MarketTicker />
          </div>
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
    </div>
  );
}