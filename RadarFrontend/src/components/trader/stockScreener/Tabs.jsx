import { motion } from "framer-motion";

export default function Tabs({ activeTab, onChange, tabs }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-white/5 bg-[#111827] p-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.01] ${
                active ? "text-white" : "text-gray-400 hover:bg-[#0f172a] hover:text-gray-200"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="screener-active-tab"
                  className="absolute inset-0 rounded-lg bg-[#1f2937]"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
