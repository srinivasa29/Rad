import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, ShieldAlert, Zap, BarChart3, PlusCircle } from "lucide-react";

export default function StockCard({ stock, isSelected, onClick, onDeepResearch }) {
  const isPositive = stock.change >= 0;
  
  const generateSparkline = (data) => {
    if (!data || data.length === 0) return "";
    const min = Math.min(...data.map(d => d.price));
    const max = Math.max(...data.map(d => d.price));
    const range = max - min || 1;
    const height = 40;
    const width = 280;
    
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.price - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  };

  return (
    <div 
      className={`trading-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      {}
      <div className="card-header">
        <div className="card-ticker">
          <span className="symbol-name">{stock.symbol}</span>
          <span className="company-name">{stock.name}</span>
        </div>
        <div className="price-box">
          <div className="price-value">{stock.price.toLocaleString('en-IN')}</div>
          <div className={`price-change flex items-center justify-end gap-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPositive ? "+" : ""}{stock.change.toFixed(2)}%
          </div>
        </div>
      </div>

      {}
      <div className="mini-chart-wrap">
        <svg width="100%" height="100%" viewBox="0 0 280 40" preserveAspectRatio="none">
           <path 
             d={generateSparkline(stock.history)} 
             fill="none" 
             stroke={isPositive ? "#34d399" : "#fb7185"} 
             strokeWidth="2"
             strokeLinecap="round"
             strokeLinejoin="round"
           />
           <defs>
              <linearGradient id={`grad-${stock.symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor={isPositive ? "#34d399" : "#fb7185"} stopOpacity="0.2" />
                 <stop offset="100%" stopColor={isPositive ? "#34d399" : "#fb7185"} stopOpacity="0" />
              </linearGradient>
           </defs>
           <path 
             d={`${generateSparkline(stock.history)} L 280 40 L 0 40 Z`} 
             fill={`url(#grad-${stock.symbol})`} 
           />
        </svg>
      </div>

      {}
      <div className="levels-grid">
        <div className="level-item">
          <span className="level-label">Entry</span>
          <span className="level-price text-sky-400">â‚¹{stock.entry}</span>
        </div>
        <div className="level-item">
          <span className="level-label">Target</span>
          <span className="level-price text-emerald-400">â‚¹{stock.target}</span>
        </div>
        <div className="level-item">
          <span className="level-label">Stop Loss</span>
          <span className="level-price text-rose-400">â‚¹{stock.sl}</span>
        </div>
      </div>

      {}
      <div className="card-footer">
        <div className="flex flex-col gap-1">
           <span className="signal-badge">{stock.signalType}</span>
           <div className="flex items-center gap-1.5 mt-1">
              <Zap size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                RVOL: <span className="text-white">{stock.rvol}x</span>
              </span>
           </div>
        </div>

        <div className="confidence-score">
           <div className="flex flex-col items-end">
             <span className="score-text">CONFIDENCE</span>
              <span className={`score-value ${stock.confidence > 80 ? "text-emerald-400" : stock.confidence > 60 ? "text-amber-400" : "text-slate-400"}`}>
                {stock.confidence}%
              </span>
           </div>
           {}
           <div className="flex gap-2">
             <button 
               title="Detailed Research"
               onClick={(e) => {
                 e.stopPropagation();
                 onDeepResearch?.(stock.symbol);
               }}
               className="h-8 w-8 rounded-full bg-sky-600/20 border border-sky-400/30 flex items-center justify-center text-sky-400 hover:bg-sky-500 hover:text-white hover:scale-110 transition-all shadow-lg shadow-sky-900/20"
             >
                <BarChart3 size={14} />
             </button>
           </div>
        </div>
      </div>
      
      {}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />
    </div>
  );
}
