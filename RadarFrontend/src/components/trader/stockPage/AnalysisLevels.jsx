import React from 'react';
import { Target, ShieldCheck, Layers } from 'lucide-react';

const LevelItem = ({ label, value, type, desc }) => (
    <div className={`flex-1 p-2 border-l-2 ${type === 'res' ? 'border-rose-500 bg-rose-500/5' : 'border-emerald-500 bg-emerald-500/5'} flex flex-col gap-0.5`}>
        <span className="text-[8px] font-black text-slate-500 uppercase">{label}</span>
        <span className="text-[11px] font-black text-white terminal-mono">₹{value.toLocaleString()}</span>
        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">{desc}</span>
    </div>
);

export default function AnalysisLevels() {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
                <Layers size={12} className="text-purple-500" />
                <span className="terminal-label">Price Matrix (S&R)</span>
                <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>

            <div className="flex gap-2">
                <LevelItem label="R2 (Resistance)" value={3120} type="res" desc="Swing High Apex" />
                <LevelItem label="R1 (Resistance)" value={2985} type="res" desc="Strong Resistance" />
                <LevelItem label="S1 (Support)" value={2850} type="sup" desc="Immediate Support" />
                <LevelItem label="S2 (Support)" value={2780} type="sup" desc="Major Volume Base" />
            </div>
        </div>
    );
}
