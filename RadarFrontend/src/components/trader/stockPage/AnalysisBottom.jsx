import React from 'react';
import { Newspaper, Globe, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Activity } from 'lucide-react';

const PerformanceCard = ({ label, value, isUp }) => (
    <div className="alpha-card p-4 flex flex-col items-center justify-center gap-1.5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <div className={`flex items-center gap-1 text-sm font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {value}
        </div>
    </div>
);

export default function AnalysisBottom({ stock }) {
    if (!stock) return null;

    const news = [
        { source: 'Reuters', time: '24m ago', title: 'Reliance Industries expands clean energy portfolio with new acquisition.' },
        { source: 'Economic Times', time: '2h ago', title: 'Why institutional investors are bullish on RIL ahead of quarterly results.' },
        { source: 'CNBC', time: '4h ago', title: 'Energy sector outperformance leads Nifty rally; RIL hits 52-week high.' }
    ];

    return (
        <div className="flex flex-col gap-8 mt-12 pb-24">
            {}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="alpha-label px-1">Performance Benchmarks</h4>
                    <span className="text-[10px] font-bold text-slate-600">VS NIFTY 50 (+1.2%)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <PerformanceCard label="1 Day" value="+1.83%" isUp={true} />
                    <PerformanceCard label="1 Week" value="+3.45%" isUp={true} />
                    <PerformanceCard label="1 Month" value="+5.80%" isUp={true} />
                    <PerformanceCard label="6 Months" value="+12.42%" isUp={true} />
                    <PerformanceCard label="1 Year" value="-8.15%" isUp={false} />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {}
                <div className="lg:col-span-2 space-y-6">
                    <div className="alpha-card p-6 bg-white/[0.02]">
                        <h4 className="alpha-label mb-4 text-white">Company Overview</h4>
                        <p className="text-[14px] leading-relaxed text-slate-400 font-medium">
                            Reliance Industries Limited (RIL) is a Fortune 500 company and the largest private sector corporation in India. It has evolved from being a textiles and polyester company into an integrated player across energy, materials, retail, entertainment and digital services. RIL's motto "Growth is Life" aptly captures its ever-evolving spirit.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-white/5">
                            <div>
                                <span className="alpha-label block mb-1">CEO</span>
                                <span className="text-sm font-black text-white">Mukesh Ambani</span>
                            </div>
                            <div>
                                <span className="alpha-label block mb-1">Founded</span>
                                <span className="text-sm font-black text-white">1966</span>
                            </div>
                            <div>
                                <span className="alpha-label block mb-1">Headquarters</span>
                                <span className="text-sm font-black text-white">Mumbai, India</span>
                            </div>
                            <div>
                                <span className="alpha-label block mb-1">Employess</span>
                                <span className="text-sm font-black text-white">2.6M +</span>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="alpha-card p-6 bg-gradient-to-br from-blue-500/[0.03] to-transparent">
                        <h4 className="alpha-label mb-6 text-white flex items-center gap-2">
                             <TrendingUp size={14} className="text-blue-500" /> Fundamentals Snapshot
                        </h4>
                        <div className="grid grid-cols-3 gap-8">
                            <div className="flex flex-col gap-1">
                                <span className="alpha-label">Revenue (TTM)</span>
                                <span className="text-xl font-black text-white terminal-value">₹9.8T</span>
                                <span className="text-[10px] font-bold text-emerald-500">+15.2% YoY</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="alpha-label">Net Profit</span>
                                <span className="text-xl font-black text-white terminal-value">₹780B</span>
                                <span className="text-[10px] font-bold text-emerald-500">+11.8% YoY</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="alpha-label">Growth Rate</span>
                                <span className="text-xl font-black text-white terminal-value">14.6%</span>
                                <span className="text-[10px] font-bold text-slate-500">Industry Avg: 12.1%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="alpha-card flex flex-col bg-[#0a0a0c]/40">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h4 className="alpha-label">Market Catalysts</h4>
                        <Newspaper size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {news.map((item, i) => (
                            <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer group">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase text-blue-500">{item.source}</span>
                                    <span className="text-[9px] font-bold text-slate-600">{item.time}</span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-300 leading-snug group-hover:text-white transition-colors">
                                    {item.title}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-white/5">
                        <button className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00f3ff] hover:text-white transition-colors">
                            View All News <ArrowUpRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
