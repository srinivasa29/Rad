import React, { useState, useMemo } from 'react';
import { ExternalLink, Calendar, Zap, TrendingUp, TrendingDown, Target, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_NEWS = [
    {
        id: 1,
        source: 'Reuters',
        time: 'Just Now',
        title: 'Reliance Expands New Energy Portfolio with Strategic Acquisition in Gujarat Hub.',
        impact: 'High',
        sentiment: 'Bullish',
        sector: 'Energy',
        relatedSymbols: ['RELIANCE', 'ADANIGREEN'],
        insight: 'Accelerates transition to Green Hydrogen; clears path for ESG-focused institutional inflows.',
        isBreaking: true
    },
    {
        id: 2,
        source: 'Bloomberg',
        time: '12m ago',
        title: 'Tech Sector Outlook: Why analysts are turning cautious on margin sustainability for H1.',
        impact: 'Medium',
        sentiment: 'Bearish',
        sector: 'Technology',
        relatedSymbols: ['TCS', 'INFY', 'WIPRO'],
        insight: 'Increasing wage pressure and slowing deal pipelines could cap near-term upside.',
        isBreaking: false
    },
    {
        id: 3,
        source: 'Economic Times',
        time: '1h ago',
        title: 'Institutional View: Heavy accumulation spotted in Private Banks ahead of Q4 results.',
        impact: 'High',
        sentiment: 'Bullish',
        sector: 'Financials',
        relatedSymbols: ['HDFCBANK', 'ICICIBANK'],
        insight: 'Derivative data suggests short-covering rally possible; levels to watch: 1,750 for HDFC.',
        isBreaking: false
    },
    {
        id: 4,
        source: 'Moneycontrol',
        time: '2h ago',
        title: 'Crude Oil Prices Stabilize as Global Supply Concerns Eased by New Production Data.',
        impact: 'Medium',
        sentiment: 'Neutral',
        sector: 'Commodities',
        relatedSymbols: ['OIL', 'ONGC'],
        insight: 'Neutral for OMCs; provides stability for energy cost forecasting in manufacturing.',
        isBreaking: false
    },
    {
        id: 5,
        source: 'Mint',
        time: '4h ago',
        title: 'Auto Sector Sales Data: EV adoption rates beat expectations in high-tier cities.',
        impact: 'Medium',
        sentiment: 'Bullish',
        sector: 'Automobile',
        relatedSymbols: ['TATAMOTORS', 'M&M'],
        insight: 'Reinforces structural shift; Tata Motors holds dominant first-mover advantage.',
        isBreaking: false
    }
];

export default function AnalysisNews() {
    const [impactFilter, setImpactFilter] = useState('All');
    const [sentimentFilter, setSentimentFilter] = useState('All');

    const filteredNews = useMemo(() => {
        return MOCK_NEWS.filter(item => {
            const matchesImpact = impactFilter === 'All' || item.impact === impactFilter;
            const matchesSentiment = sentimentFilter === 'All' || item.sentiment === sentimentFilter;
            return matchesImpact && matchesSentiment;
        });
    }, [impactFilter, sentimentFilter]);

    const getSentimentColor = (sentiment) => {
        if (sentiment === 'Bullish') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
        if (sentiment === 'Bearish') return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
        return 'text-slate-400 border-slate-700 bg-slate-800/20';
    };

    const getImpactStyles = (impact) => {
        if (impact === 'High') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (impact === 'Medium') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
        return 'bg-slate-800 text-slate-500 border-slate-700';
    };

    return (
        <div className="flex flex-col gap-6">
            {}
            <div className="flex flex-wrap items-center justify-between gap-4 px-1 pb-2 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">Impact:</span>
                        <div className="flex bg-slate-900/50 p-1 rounded-lg gap-1 border border-white/5">
                            {['All', 'High', 'Medium'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setImpactFilter(f)}
                                    className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${impactFilter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-900/10' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">Sentiment:</span>
                        <div className="flex bg-slate-900/50 p-1 rounded-lg gap-1 border border-white/5">
                            {['All', 'Bullish', 'Bearish'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSentimentFilter(f)}
                                    className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${sentimentFilter === f ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                   <Target size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Trader Intelligence Active</span>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredNews.map((item) => (
                        <motion.div 
                            layout
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className={`group relative flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-300 ${item.sentiment === 'Bullish' ? 'border-emerald-500/10 hover:border-emerald-500/30 bg-emerald-500/[0.01]' : item.sentiment === 'Bearish' ? 'border-rose-500/10 hover:border-rose-500/30 bg-rose-500/[0.01]' : 'border-white/[0.03] hover:border-white/10 bg-white/[0.01]'}`}
                        >
                            {}
                            <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${item.sentiment === 'Bullish' ? 'bg-emerald-500/40' : item.sentiment === 'Bearish' ? 'bg-rose-500/40' : 'bg-slate-700'}`} />

                            {}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getImpactStyles(item.impact)}`}>
                                        {item.impact} IMPACT
                                    </span>
                                    <div className="h-4 w-[1px] bg-white/5" />
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{item.source}</span>
                                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                                    <span className={`text-[10px] font-bold flex items-center gap-1.5 ${item.isBreaking ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`}>
                                        {item.isBreaking ? <Zap size={10} className="fill-cyan-400" /> : <Calendar size={10} />}
                                        {item.isBreaking ? 'BREAKING' : item.time}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {item.sector}
                                </div>
                            </div>

                            {}
                            <div className="flex justify-between items-start gap-6">
                                <h4 className="text-[15px] font-bold text-slate-100 leading-tight group-hover:text-white transition-colors">
                                    {item.title}
                                </h4>
                                <ExternalLink size={14} className="mt-1 text-slate-600 group-hover:text-cyan-400 flex-shrink-0 transition-all opacity-0 group-hover:opacity-100" />
                            </div>

                            {}
                            <div className="flex flex-wrap gap-2">
                                {item.relatedSymbols.map(sym => (
                                    <button 
                                        key={sym}
                                        className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-white/10 text-[9px] font-black text-cyan-200 hover:border-cyan-400/40 hover:text-white transition-all tracking-wider"
                                    >
                                        ${sym}
                                    </button>
                                ))}
                            </div>

                            {}
                            <div className="mt-2 p-3 rounded-xl bg-white/[0.04] border-l-2 border-cyan-500/30 flex items-start gap-3 group/insight">
                                <div className="mt-0.5 text-cyan-500/50">
                                    <Info size={14} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/60">Trader Insight</span>
                                    <p className="text-[12px] font-medium text-slate-300 leading-relaxed italic">
                                        "{item.insight}"
                                    </p>
                                </div>
                            </div>
                        </motion.div> 
                    ))}
                </AnimatePresence>
            </div>

            <button className="mx-auto mt-4 px-8 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:border-white/10 hover:bg-white/[0.04] transition-all">
                Sync Terminal Feed
            </button>
        </div>
    );
}
