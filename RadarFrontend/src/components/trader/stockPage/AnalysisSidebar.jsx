import React from 'react';
import { BrainCircuit, TrendingUp, BarChart3, ArrowUpRight,Zap, Activity, Globe, Compass, AlertCircle } from 'lucide-react';

export default function AnalysisSidebar({ stock }) {
    if (!stock) return null;

    const peers = [
        { name: 'ONGC', change: '+2.4%', up: true, momentum: 'high' },
        { name: 'BPCL', change: '+1.8%', up: true, momentum: 'med' },
        { name: 'IOC', change: '-0.4%', up: false, momentum: 'low' },
        { name: 'HINDPETRO', change: '+3.2%', up: true, momentum: 'high' },
    ];

    const opportunities = [
        { name: 'TATA MOTORS', pattern: 'Breakout', change: '+1.5%' },
        { name: 'HDFC BANK', pattern: 'Pullback', change: '-0.2%' },
        { name: 'INFOYS', pattern: 'Momentum', change: '+2.1%' },
    ];

    return (
        <div className="flex flex-col gap-4">
            {}
            <div className="terminal-card bg-blue-500/5 border-blue-500/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit size={14} className="text-blue-400" />
                    <span className="terminal-label text-white">Smart Insights</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-start gap-2">
                        <div className="mt-1 w-1 h-1 rounded-full bg-emerald-500"></div>
                        <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                            <span className="text-white font-bold">Breakout Confirmed:</span> Price closing above ₹2,850 supply base with high volume.
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="mt-1 w-1 h-1 rounded-full bg-blue-500"></div>
                        <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                            <span className="text-white font-bold">Indicator Alignment:</span> RSI (66) and MACD show strong supporting bullish momentum.
                        </p>
                    </div>
                </div>
            </div>

            {}
            <div className="terminal-card p-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                         <Globe size={12} className="text-purple-400" />
                         <span className="terminal-label">Sector Strength</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Energy Sector</span>
                </div>
                <div className="space-y-1.5">
                    {peers.map((peer, i) => (
                        <div key={i} className="flex items-center justify-between p-2 py-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-200">{peer.name}</span>
                                {peer.momentum === 'high' && <Zap size={8} className="text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black ${peer.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {peer.change}
                                </span>
                                {peer.up ? <ArrowUpRight size={10} className="text-emerald-500" /> : <TrendingUp size={10} className="text-rose-500 rotate-180" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {}
            <div className="terminal-card p-3">
                <div className="flex items-center gap-2 mb-3">
                    <Compass size={12} className="text-indigo-400" />
                    <span className="terminal-label">Similar Opportunities</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                    {opportunities.map((opp, i) => (
                        <div key={i} className="flex items-center justify-between p-2 py-1.5 rounded bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/20 transition-all cursor-pointer">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white">{opp.name}</span>
                                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">{opp.pattern} Pattern</span>
                            </div>
                            <span className={`text-[10px] font-black ${opp.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{opp.change}</span>
                        </div>
                    ))}
                </div>
            </div>

            {}
            <div className="terminal-card p-3">
                 <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={12} className="text-yellow-500" />
                    <span className="terminal-label">Unusual Activity</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-1.5 rounded bg-black/20 text-[9px] font-bold">
                        <span className="text-slate-400">14:22:15</span>
                        <span className="text-emerald-500 uppercase tracking-tighter">Volume Spike: +400% avg</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-black/20 text-[9px] font-bold">
                        <span className="text-slate-400">13:45:00</span>
                        <span className="text-blue-500 uppercase tracking-tighter">Gap Up Confirmation</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
