import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockFinancials = [
    { year: '2020', revenue: 60, income: 40, eps: 15.4 },
    { year: '2021', revenue: 75, income: 49, eps: 18.2 },
    { year: '2022', revenue: 85, income: 61, eps: 22.1 },
    { year: '2023', revenue: 98, income: 72, eps: 25.8 },
];

export default function AnalysisFinancials() {
    return (
        <div className="flex flex-col gap-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {}
                <div className="rs-card-minimal">
                    <h3 className="rs-label-sm uppercase mb-6 tracking-widest">Revenue & Net Income (â‚¹B)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockFinancials}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#787b86' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#787b86' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1b1e2e', border: '1px solid #2a2e39', borderRadius: '4px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Bar dataKey="revenue" fill="#2962ff" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="income" fill="#089981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {}
                <div className="rs-card-minimal">
                    <h3 className="rs-label-sm uppercase mb-6 tracking-widest">EPS Growth (â‚¹)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockFinancials}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#787b86' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#787b86' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1b1e2e', border: '1px solid #2a2e39', borderRadius: '4px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Bar dataKey="eps" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {}
            <section>
                <h3 className="rs-label-sm uppercase mb-6 tracking-widest">Income Statement Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="py-4 rs-label-sm">Metric (â‚¹B)</th>
                                <th className="py-4 rs-label-sm text-right">FY 2023</th>
                                <th className="py-4 rs-label-sm text-right">FY 2022</th>
                                <th className="py-4 rs-label-sm text-right">Growth (%)</th>
                            </tr>
                        </thead>
                        <tbody className="text-[14px] font-medium text-slate-300">
                            <tr className="border-b border-slate-800/50">
                                <td className="py-4">Total Revenue</td>
                                <td className="py-4 text-right">9,804.20</td>
                                <td className="py-4 text-right">8,521.10</td>
                                <td className="py-4 text-right rs-up">+15.2%</td>
                            </tr>
                            <tr className="border-b border-slate-800/50">
                                <td className="py-4">Operating Expense</td>
                                <td className="py-4 text-right">7,120.45</td>
                                <td className="py-4 text-right">6,400.20</td>
                                <td className="py-4 text-right rs-down">+11.2%</td>
                            </tr>
                            <tr className="border-b border-slate-800/50">
                                <td className="py-4">Net Income</td>
                                <td className="py-4 text-right">720.15</td>
                                <td className="py-4 text-right">612.40</td>
                                <td className="py-4 text-right rs-up">+17.6%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
