import React from 'react';
import { Target, ShieldAlert, BarChart3, TrendingUp, Info } from 'lucide-react';

export default function TradeInsights() {
    const riskReward = 3.2;

    return (
        <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between px-2">
                <h4 className="alpha-label">Trade Intelligence</h4>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-tighter">
                    Setup Active
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="insight-item border-[#10b981]/20">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <TrendingUp size={14} />
                        <span className="alpha-label text-emerald-500/80">Entry Zone</span>
                    </div>
                    <span className="text-xl font-black text-white terminal-value">â‚¹2,855 - 2,870</span>
                    <p className="text-[9px] text-slate-500 mt-1 font-medium italic">Wait for pull-back to 21 EMA</p>
                </div>

                <div className="insight-item border-[#3b82f6]/20">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <Target size={14} />
                        <span className="alpha-label text-blue-500/80">Profit Target</span>
                    </div>
                    <span className="text-xl font-black text-white terminal-value">â‚¹3,040 - 3,120</span>
                    <p className="text-[9px] text-slate-500 mt-1 font-medium italic">Projected 8.5% Upside</p>
                </div>

                <div className="insight-item border-[#ef4444]/20">
                    <div className="flex items-center gap-2 mb-2 text-rose-400">
                        <ShieldAlert size={14} />
                        <span className="alpha-label text-rose-500/80">Stop Loss</span>
                    </div>
                    <span className="text-xl font-black text-white terminal-value">â‚¹2,810.00</span>
                    <p className="text-[9px] text-slate-500 mt-1 font-medium italic">Below previous swing low</p>
                </div>

                <div className="insight-item bg-blue-600/5 border-blue-600/20 shadow-lg shadow-blue-600/5">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <BarChart3 size={14} />
                        <span className="alpha-label text-blue-500/80">Risk / Reward</span>
                    </div>
                    <span className="text-xl font-black text-white terminal-value">1 : {riskReward}</span>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                        <div className="h-full bg-rose-500" style={{ width: '25%' }}></div>
                        <div className="h-full bg-emerald-500" style={{ width: '75%' }}></div>
                    </div>
                </div>
            </div>

            {}
            <div className="alpha-card bg-blue-600/[0.03] border-blue-600/20 p-5 mt-2">
                <div className="flex items-center gap-2 mb-3">
                    <Info size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ffffff]">Why this Opportunity?</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <div className="mt-1 w-1 h-1 rounded-full bg-blue-500"></div>
                            <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-white font-bold">Trend Alignment:</span> Stock is trading above all major MAs (20, 50, 200) on both Daily and Weekly charts.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-1 w-1 h-1 rounded-full bg-blue-500"></div>
                            <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-white font-bold">Volume Confirmation:</span> Recent 2% candle was backed by 1.5x average weekly volume.</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <div className="mt-1 w-1 h-1 rounded-full bg-blue-500"></div>
                            <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-white font-bold">Sector Tailwinds:</span> Major peers in the Energy sector have shown 3.2% relative outperformance this week.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-1 w-1 h-1 rounded-full bg-blue-500"></div>
                            <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-white font-bold">Catalyst:</span> Technical breakout above long-term resistance of â‚¹2,850 now confirmed as Support.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
