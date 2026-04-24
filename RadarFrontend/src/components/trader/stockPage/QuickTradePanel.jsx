import React from 'react';
import { Target, ShieldAlert, TrendingUp, BarChart3 } from 'lucide-react';

const QuickCard = ({ icon: Icon, label, value, sub, colorClass }) => (
    <div className="matrix-item flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
            <Icon size={12} className={colorClass} />
            <span className="terminal-label">{label}</span>
        </div>
        <span className="text-sm font-black text-white terminal-mono">{value}</span>
        <span className="text-[8px] font-bold text-slate-500 uppercase">{sub}</span>
    </div>
);

export default function QuickTradePanel() {
    return (
        <div className="terminal-matrix">
            <QuickCard 
                icon={TrendingUp} 
                label="Entry Zone" 
                value="₹2,855.00" 
                sub="Buy on Pullback" 
                colorClass="text-emerald-500" 
            />
            <QuickCard 
                icon={Target} 
                label="Target (T1)" 
                value="₹3,040.00" 
                sub="Proj Upside +8.2%" 
                colorClass="text-blue-500" 
            />
            <QuickCard 
                icon={ShieldAlert} 
                label="Stop Loss" 
                value="₹2,810.00" 
                sub="Swing Low Exit" 
                colorClass="text-rose-500" 
            />
            <div className="matrix-item flex flex-col gap-1 bg-blue-500/[0.03] border-blue-500/20">
                <div className="flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-blue-400" />
                    <span className="terminal-label text-blue-400">R/R Ratio</span>
                </div>
                <span className="text-sm font-black text-white terminal-mono">1 : 3.2</span>
                <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden flex">
                    <div className="h-full bg-rose-500" style={{ width: '25%' }}></div>
                    <div className="h-full bg-emerald-500" style={{ width: '75%' }}></div>
                </div>
            </div>
        </div>
    );
}
