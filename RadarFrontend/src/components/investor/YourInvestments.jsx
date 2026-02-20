import React from 'react';
import { PieChart } from 'lucide-react';

const YourInvestments = () => {
    return (
        <div className="investor-card p-6 flex flex-col items-center justify-between text-center h-full min-h-[320px] border border-slate-100/50 relative overflow-hidden bg-white">
            <div className="w-full text-left mb-2 z-10">
                <h3 className="text-lg font-bold text-slate-800">Recently Watched</h3>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 w-full z-10 py-4">
                <div className="w-20 h-20 mb-6 bg-emerald-50 rounded-full flex items-center justify-center relative shadow-inner">
                    <div className="absolute inset-0 bg-emerald-100/30 blur-xl"></div>
                    <PieChart size={32} className="text-emerald-500/40 relative z-10" />

                    {/* Abstract illustration elements */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <h4 className="text-sm font-black text-slate-800 mb-2">Your watchlist is waiting for action.</h4>
                <p className="text-xs text-slate-400 mb-8 max-w-[220px] leading-relaxed">Start exploring to fill this space with your favorite market movers!</p>

                <button className="px-8 py-2.5 bg-emerald-500 text-white text-[11px] font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 uppercase tracking-wider">
                    Start Exploring
                </button>
            </div>
        </div>
    );
};

export default YourInvestments;
