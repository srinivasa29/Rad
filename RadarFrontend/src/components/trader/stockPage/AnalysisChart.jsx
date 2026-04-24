import React, { useMemo, useState } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Maximize2, Settings, Plus, LayoutGrid, Layers, Info } from 'lucide-react';

const generateMockTechnicalData = (points = 80) => {
    let basePrice = 2870;
    return Array.from({ length: points }, (_, i) => {
        const date = new Date();
        date.setMinutes(date.getMinutes() - (points - i) * 15);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const open = basePrice + (Math.random() - 0.5) * 8;
        const close = open + (Math.random() - 0.5) * 12;
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        basePrice = close;
        
        return {
            time, open, high, low, close,
            price: close,
            volume: Math.floor(Math.random() * 700000) + 100000,
            sma20: close * 0.998,
            ema50: close * 0.988
        };
    });
};

export default function AnalysisChart({ symbol = 'RELIANCE' }) {
    const data = useMemo(() => generateMockTechnicalData(), [symbol]);
    const [activeTab, setActiveTab] = useState('Overview');

    return (
        <div className="terminal-card flex flex-col h-[520px]">
            {}
            <div className="p-2 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="flex bg-black/40 p-0.5 rounded border border-white/5">
                        {['1D', '5D', '1M', '1Y'].map(tf => (
                            <button key={tf} className={`px-2 py-1 text-[9px] font-black rounded ${tf === '1D' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                                {tf}
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <div className="flex gap-2">
                         <button className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-400 border border-white/10 rounded hover:bg-white/5">
                            <Layers size={12} className="text-blue-500" /> Indicators
                         </button>
                         <button className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-400 border border-white/10 rounded hover:bg-white/5">
                            <LayoutGrid size={12} className="text-emerald-500" /> Candlesticks
                         </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="p-1.5 text-slate-500 hover:text-white"><Settings size={14} /></button>
                    <button className="p-1.5 text-slate-500 hover:text-white"><Maximize2 size={14} /></button>
                </div>
            </div>

            {}
            <div className="flex-1 relative pt-2">
                 <div className="absolute top-4 left-6 z-10 flex gap-4 pointer-events-none">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase">SMA 20</span>
                        <span className="text-[10px] font-bold text-blue-400">2,874.12</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase">EMA 50</span>
                        <span className="text-[10px] font-bold text-purple-400">2,842.00</span>
                    </div>
                 </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                        <XAxis 
                            dataKey="time" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 8, fill: '#4b5563', fontWeight: 600 }} 
                            minTickGap={60}
                        />
                        <YAxis 
                            orientation="right" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 8, fill: '#4b5563', fontFamily: 'monospace', fontWeight: 600 }} 
                            domain={['auto', 'auto']}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0c0d10', border: '1px solid #2a2e33', borderRadius: '4px', padding: '6px' }}
                            itemStyle={{ fontSize: '9px', padding: '1px 0' }}
                            labelStyle={{ display: 'none' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        
                        <Bar dataKey="price" fill="#10b981" radius={[1, 1, 0, 0]} barSize={12}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.close > entry.open ? 'rgba(0, 200, 5, 0.4)' : 'rgba(255, 59, 48, 0.4)'} />
                            ))}
                        </Bar>

                        <Line type="monotone" dataKey="sma20" stroke="#2962ff" dot={false} strokeWidth={1.5} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="ema50" stroke="#a855f7" dot={false} strokeWidth={1.2} />
                        
                        <Bar dataKey="volume" yAxisId="vol" fillOpacity={0.03} />
                        <YAxis yAxisId="vol" hide />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
