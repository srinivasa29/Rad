import React from 'react';
import { ShieldCheck, Zap, Activity, TrendingUp } from 'lucide-react';

const SnapshotCard = ({ label, value, signal }) => {
    const isBull = signal === 'Buy' || signal === 'Strong Buy';
    const isBear = signal === 'Sell' || signal === 'Strong Sell';
    
    return (
        <div className="flex-1 p-2 rounded border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-white terminal-mono">{value}</span>
                <span className={`text-[9px] font-black uppercase ${isBull ? 'text-emerald-500' : isBear ? 'text-rose-500' : 'text-slate-500'}`}>
                    {signal}
                </span>
            </div>
        </div>
    );
};

export default function TechnicalPanel() {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
                <Activity size={12} className="text-blue-500" />
                <span className="terminal-label">Technical Snapshot</span>
                <div className="flex-1 h-[1px] bg-white/5"></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Aggregated: Strong Buy</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
                <SnapshotCard label="RSI (14)" value="66.2" signal="Neutral" />
                <SnapshotCard label="MACD (12,26)" value="24.4" signal="Buy" />
                <SnapshotCard label="CCI (20)" value="112" signal="Buy" />
                <SnapshotCard label="SMA (20)" value="2874" signal="Buy" />
                <SnapshotCard label="EMA (50)" value="2842" signal="Buy" />
                <SnapshotCard label="SMA (200)" value="2654" signal="Strong Buy" />
            </div>
        </div>
    );
}
