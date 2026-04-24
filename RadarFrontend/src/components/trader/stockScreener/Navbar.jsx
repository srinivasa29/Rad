import { Bell, ChevronDown, Menu, Search } from "lucide-react";

const NAV_ITEMS = ["Dashboard", "Watchlist", "Screeners"];

export default function Navbar({ activeItem = "Screeners" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0b1220]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-[#111827] text-sm font-bold text-white shadow-sm">
            R
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.18em] text-white">RADAR</div>
            <div className="text-xs text-gray-500">Market intelligence workspace</div>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = item === activeItem;
            return (
              <button
                key={item}
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#111827] text-white border border-white/5"
                    : "text-gray-400 hover:bg-[#111827] hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-white/5 bg-[#111827] px-3 py-2 lg:flex">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search stocks, sectors, setups"
              className="w-72 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-[#111827] text-gray-300 transition-colors hover:bg-[#1f2937] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-lg border border-white/5 bg-[#111827] px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-[#1f2937] hover:text-white sm:inline-flex"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b82f6]/15 text-xs font-semibold text-[#93c5fd]">A</span>
            <span>Alex</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-[#111827] text-gray-400 transition-colors hover:bg-[#1f2937] hover:text-white md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
