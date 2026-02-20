{/* Left: Brand & Nav */ }
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeModule === item.id
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

{/* Right: Search & Actions */ }
<div className="flex items-center gap-6">
    <div className="relative group w-64 hidden xl:block">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00f3ff] transition-colors">
            <Search size={14} />
        </div>
        <input
            type="text"
            placeholder="Search markets..."
            className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#00f3ff]/50 focus:shadow-[0_0_15px_rgba(0,243,255,0.1)] transition-all placeholder:text-gray-600"
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
        <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#bc13fe] flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-lg hover:scale-105 transition-transform"
        >
            {userInitial}
        </div>
    </div>
</div>
        </div >
      </header >

    <main className="content fade-in transition-all duration-300 w-full">
        {isTraderMode ? (
            <TraderView data={mockStock} activeModule={activeModule} />
        ) : (
            <InvestorView
                data={mockStock}
                movers={topMovers}
                activeModule={activeModule}
            />
        )}
    </main>
    </div >
  );
}
