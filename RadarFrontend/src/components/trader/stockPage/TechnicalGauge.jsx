import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Gauge, Zap } from 'lucide-react';

export default function TechnicalGauge({ status = 'Buy', score = 75 }) {
    const getRotation = () => {
        if (status === 'Strong Sell') return -72;
        if (status === 'Sell') return -36;
        if (status === 'Neutral') return 0;
        if (status === 'Buy') return 36;
        if (status === 'Strong Buy') return 72;
        return 0;
    };

    return (
        <div className="alpha-bento-card h-full flex flex-col area-signals bg-gradient-to-br from-white/[0.03] to-transparent">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h4 className="terminal-label">Trader Sentiment</h4>
                <div className="flex items-center gap-1.5">
                     <span className="text-[10px] font-black text-emerald-400">75/100</span>
                </div>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden">
                {}
                <div className="relative w-full max-w-[200px] aspect-[1.8/1]">
                    <svg viewBox="0 0 200 110" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,243,255,0.1)]">
                        <defs>
                            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="50%" stopColor="#64748b" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="url(#gaugeGrad)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray="251.32"
                            strokeDashoffset="0"
                            opacity="0.2"
                        />
                        
                        {}
                        <motion.g
                            initial={{ rotate: -90 }}
                            animate={{ rotate: getRotation() }}
                            transition={{ type: 'spring', stiffness: 50, damping: 10 }}
                            style={{ originX: '100px', originY: '100px' }}
                        >
                            <circle cx="100" cy="100" r="4" fill="#00f3ff" />
                            <path d="M 100 100 L 100 35" stroke="#00f3ff" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="100" cy="100" r="8" fill="#00f3ff" fillOpacity="0.1" />
                        </motion.g>
                    </svg>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-2 flex flex-col items-center">
                        <span className="text-xl font-black text-white uppercase tracking-tight">{status}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Aggregated Signal</span>
                    </div>
                </div>

                {}
                <div className="absolute bottom-4 left-6 text-[8px] font-black text-rose-500 uppercase">Extreme Fear</div>
                <div className="absolute bottom-4 right-6 text-[8px] font-black text-emerald-500 uppercase">Extreme Greed</div>
            </div>

            {}
            <div className="p-4 border-t border-white/5 space-y-2.5 bg-white/[0.01]">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase flex items-center gap-2"><Zap size={10} className="text-emerald-400" /> RSI (14)</span>
                    <span className="text-white font-black terminal-value">66.2</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase flex items-center gap-2"><Compass size={10} className="text-cyan-400" /> ADX (14)</span>
                    <span className="text-white font-black terminal-value">32.4</span>
                </div>
            </div>
        </div>
    );
}
