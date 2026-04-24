import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const mockRsiData = Array.from({ length: 40 }, (_, i) => ({
    time: i,
    val: 40 + Math.random() * 30
}));

export default function AnalysisTechnicals() {
    return (
        <div className="flex flex-col gap-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {}
                <div className="rs-card-minimal">
                    <h3 className="rs-label-sm uppercase mb-6 tracking-widest">Relative Strength Index (14)</h3>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockRsiData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                                <XAxis dataKey="time" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#787b86' }} domain={[0, 100]} />
                                <ReferenceLine y={70} stroke="#f23645" strokeDasharray="3 3" />
                                <ReferenceLine y={30} stroke="#089981" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="val" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                        <span>Oversold: 30</span>
                        <span>Current: 62.4</span>
                        <span>Overbought: 70</span>
                    </div>
                </div>

                {}
                <div className="rs-card-minimal">
                    <h3 className="rs-label-sm uppercase mb-6 tracking-widest">Key Price Levels</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Resistance 1', val: '2,992.00', type: 'res' },
                            { label: 'Pivot Point', val: '2,870.15', type: 'piv' },
                            { label: 'Support 1', val: '2,839.00', type: 'sup' },
                        ].map((node, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                                <span className="text-[14px] font-bold text-slate-400">{node.label}</span>
                                <span className={`terminal-value text-lg font-bold ${node.type === 'res' ? 'rs-down' : node.type === 'sup' ? 'rs-up' : 'text-slate-200'}`}>
                                    â‚¹{node.val}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {}
            <section>
                <h3 className="rs-label-sm uppercase mb-6 tracking-widest">Moving Averages Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'EMA (9)', val: '2,874.10', pos: true },
                        { label: 'EMA (20)', val: '2,862.45', pos: true },
                        { label: 'SMA (50)', val: '2,840.10', pos: true },
                        { label: 'SMA (200)', val: '2,650.00', pos: true },
                    ].map((ma, i) => (
                        <div key={i} className="p-4 bg-white/[0.02] border border-slate-800 rounded">
                            <span className="rs-label-sm block mb-1">{ma.label}</span>
                            <span className="text-[14px] font-bold text-slate-200 block mb-1">â‚¹{ma.val}</span>
                            <span className={`text-[10px] font-black uppercase ${ma.pos ? 'rs-up' : 'rs-down'}`}>
                                {ma.pos ? 'Above' : 'Below'} Price
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
