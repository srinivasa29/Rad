import React from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, Bell } from 'lucide-react';
import { motion } from 'framer-motion';


export const NewsBadge = ({ count, hasToday, unread, onClick }) => {
  if (count === 0) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50">
        <Newspaper className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-medium text-slate-500">0</span>
      </div>
    );
  }

  const bgColor = hasToday ? 'bg-cyan-500/20 border-cyan-400/40' : 'bg-slate-700/30 border-slate-600/40';
  const textColor = hasToday ? 'text-cyan-300' : 'text-slate-400';

  return (
    <motion.button
      onClick={onClick}
      className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all duration-200 hover:scale-105 ${bgColor}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Newspaper className={`w-3 h-3 ${textColor}`} />
      <span className={`text-[10px] font-semibold ${textColor}`}>{count}</span>
      {unread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-rose-500 rounded-full border border-slate-900"
        >
          {unread}
        </motion.span>
      )}
    </motion.button>
  );
};


export const SentimentDisplay = ({ sentiment, compact = false }) => {
  const getSentimentIcon = (score) => {
    if (score > 20) return TrendingUp;
    if (score < -20) return TrendingDown;
    return Minus;
  };

  const getSentimentColor = (score) => {
    if (score > 50) return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/40';
    if (score > 20) return 'text-green-400 bg-green-500/20 border-green-400/40';
    if (score > -20) return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/40';
    if (score > -50) return 'text-orange-400 bg-orange-500/20 border-orange-400/40';
    return 'text-rose-400 bg-rose-500/20 border-rose-400/40';
  };

  const getSentimentLabel = (score) => {
    if (score > 50) return 'V.Positive';
    if (score > 20) return 'Positive';
    if (score > -20) return 'Neutral';
    if (score > -50) return 'Negative';
    return 'V.Negative';
  };

  const Icon = getSentimentIcon(sentiment);
  const colorClass = getSentimentColor(sentiment);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${colorClass}`}>
        <span className="text-[10px] font-bold">{sentiment > 0 ? '+' : ''}{sentiment}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <div className="flex flex-col items-start">
        <span className="text-[9px] font-medium opacity-70">{getSentimentLabel(sentiment)}</span>
        <span className="text-xs font-bold">{sentiment > 0 ? '+' : ''}{sentiment}</span>
      </div>
    </div>
  );
};


export const ToolbarButton = ({ icon: Icon, label, onClick, active = false, badge = null, variant = 'default' }) => {
  const variants = {
    default: active 
      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' 
      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-300',
    primary: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30',
    success: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30',
    danger: 'bg-rose-500/20 border-rose-400/50 text-rose-300 hover:bg-rose-500/30',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${variants[variant]}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
      {badge !== null && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-white/10 rounded-full">
          {badge}
        </span>
      )}
    </motion.button>
  );
};


export const KeyboardHint = ({ keys }) => {
  return (
    <div className="inline-flex items-center gap-0.5">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-[9px] text-slate-500 mx-0.5">+</span>}
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-300 bg-slate-800 border border-slate-600 rounded shadow-sm">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  );
};


export const ExportMenu = ({ onExportCSV, onExportJSON, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="absolute right-0 top-12 z-50 min-w-[200px] rounded-lg border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
    >
      <div className="p-2">
        <button
          onClick={onExportCSV}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
        >
          <span className="text-xs">ðŸ“„</span>
          <div className="flex-1">
            <div className="font-medium">Export as CSV</div>
            <div className="text-[10px] text-slate-500">Excel-compatible format</div>
          </div>
        </button>
        <button
          onClick={onExportJSON}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
        >
          <span className="text-xs">ðŸ“‹</span>
          <div className="flex-1">
            <div className="font-medium">Export as JSON</div>
            <div className="text-[10px] text-slate-500">Developer format</div>
          </div>
        </button>
      </div>
    </motion.div>
  );
};


export const NotificationBanner = ({ onEnable, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4"
    >
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-cyan-400" />
        <div>
          <div className="text-sm font-semibold text-cyan-300">Enable Desktop Notifications</div>
          <div className="text-xs text-cyan-400/70">Get instant alerts for breaking news on your watchlist stocks</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onEnable}
          className="px-4 py-2 text-xs font-semibold text-cyan-100 bg-cyan-500/30 border border-cyan-400/50 rounded-lg hover:bg-cyan-500/40 transition-colors"
        >
          Enable
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          Later
        </button>
      </div>
    </motion.div>
  );
};

export default {
  NewsBadge,
  SentimentDisplay,
  ToolbarButton,
  KeyboardHint,
  ExportMenu,
  NotificationBanner,
};
