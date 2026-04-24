import { Filter, RotateCcw, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingActionBar({ visible, onApply, onReset, onSave }) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-5 left-1/2 z-40 w-[92%] max-w-xl -translate-x-1/2 rounded-xl border border-white/5 bg-[#111827]/95 px-3 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.01] hover:bg-blue-600"
        >
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/5 bg-[#0f172a] px-3 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:scale-[1.01] hover:bg-[#1f2937] hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/5 bg-[#0f172a] px-3 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:scale-[1.01] hover:bg-[#1f2937] hover:text-white"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </motion.div>
  );
}
