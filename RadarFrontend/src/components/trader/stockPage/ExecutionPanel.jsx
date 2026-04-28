import React, { useState } from 'react';
import { Target, Shield, Gauge, Calculator } from 'lucide-react';

export default function ExecutionPanel() {
    const [orderType, setOrderType] = useState('Market');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(2870.15);

    return (
        <div className="alpha-bento-card h-full flex flex-col area-trade">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h4 className="terminal-label">Trade Execution</h4>
                <Calculator size={14} className="text-slate-500 cursor-pointer hover:text-white" />
            </div>

            <div className="flex-1 p-4 flex flex-col gap-5">
                {}
                <div className="flex bg-white/5 p-1 rounded-lg">
                    {['Market', 'Limit', 'SL'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setOrderType(type)}
                            className={`flex-1 py-1.5 text-[10px] font-black rounded transition-all ${orderType === type ? 'bg-[#00f3ff] text-[#020617]' : 'text-slate-400 hover:text-white'}`}
                        >
                            {type.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Quantity</label>
                        <input 
                            type="number" 
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm font-bold terminal-value focus:border-[#00f3ff]/50 outline-none"
                        />
                    </div>

                    {orderType !== 'Market' && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Price</label>
                            <input 
                                type="number" 
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm font-bold terminal-value focus:border-[#00f3ff]/50 outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button className="flex flex-col items-center justify-center gap-1 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all group">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest group-hover:scale-110 transition-transform">Buy</span>
                        <span className="text-[9px] text-emerald-500/60 font-medium">Asks: 2,870.25</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 py-4 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all group">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest group-hover:scale-110 transition-transform">Sell</span>
                        <span className="text-[9px] text-rose-500/60 font-medium">Bids: 2,870.10</span>
                    </button>
                </div>
            </div>

            {}
            <div className="p-4 bg-white/[0.02] border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase flex items-center gap-1.5">
                        <Shield size={12} className="text-emerald-500" /> Max Risk
                    </span>
                    <span className="font-bold text-slate-300">₹1,250.00</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase flex items-center gap-1.5">
                        <Target size={12} className="text-cyan-500" /> Target
                    </span>
                    <span className="font-bold text-slate-300">₹3,420.00</span>
                </div>
            </div>
        </div>
    );
}
