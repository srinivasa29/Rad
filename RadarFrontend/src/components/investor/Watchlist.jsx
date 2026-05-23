import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, CheckCircle, AlertTriangle, Eye, ShieldAlert, Plus, Bell, Activity, TrendingUp, TrendingDown, Info, ArrowRight, CornerRightDown, AlignLeft, Filter, BookOpen, Bookmark, SlidersHorizontal, Trash2, PieChart, BarChart3, ExternalLink, X } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, CartesianGrid } from 'recharts';
import api from '../../api/api';
import { useSocket } from '../../hooks/useSocket';
import { AlertsDrawer } from './charts/SidebarDrawers';

const mockSparklinePositive = Array.from({ length: 15 }, (_, i) => ({ value: 60 + Math.sin(i / 2) * 20 }));
const mockSparklineNegative = Array.from({ length: 15 }, (_, i) => ({ value: 60 - Math.sin(i / 2) * 20 }));

const MOCK_WATCHLIST_EMPTY = false;

const mockAttentionStocks = [
    { name: 'Nifty 50', price: '22,450', change: '+0.8%', isPositive: true, tagTop: 'Market Index', tagTopColor: 'blue', insight: 'Trading near psychological resistance of 22,500.' },
    { name: 'HDFC Bank', price: '1,652', change: '+0.4%', isPositive: true, tagTop: 'High Delivery', tagTopColor: 'blue', insight: 'Significant institutional accumulation detected at support.' }
];
const mockRecentChanges = [
    { title: 'Market Sentiment Shift', desc: 'Overall market bias shifted from Neutral to Bullish based on index internals.', type: 'positive', date: 'Today', time: '10:45 AM' },
    { title: 'Banking Sector Breakout', desc: 'Major private banks showing volume breakout patterns on daily charts.', type: 'positive', date: 'Today', time: '09:15 AM' }
];
const mockWatchlistGrid = [];

const mockWhyThisMatters = [];
const mockCompareAndReflect = [];

const TooltipInfo = ({ text }) => (
    <div className="relative group/tooltip inline-flex items-center ml-2 align-middle">
        <Info size={14} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-[12px] font-medium leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none text-center normal-case tracking-normal">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
    </div>
);

const EmptyState = ({ onAdd }) => (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[20px] border border-slate-100/50 shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-blue-50/50">
            <BookOpen size={32} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Build Your Intelligence Hub</h3>
        <p className="text-slate-500 mb-8 max-w-md text-[15px] leading-relaxed">
            Your watchlist acts as your personal decision-support system. Track stocks, get smart signals, and cut through the noise.
        </p>



        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all hover:shadow-lg flex items-center gap-2">
            <Search size={18} /> Explore All Stocks
        </button>
    </div>
);

const AttentionCard = ({ stock }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-[16px] p-5 border border-slate-100 hover:border-blue-100 transition-all flex flex-col justify-between shadow-sm relative group h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-slate-800 text-base">{stock.name}</h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-black text-slate-900">{stock.price}</span>
                        <span className={`text-[11px] font-bold ${stock.isPositive ? 'text-blue-600' : 'text-rose-500'}`}>
                            {stock.change} today
                        </span>
                    </div>
                </div>
                {stock.tagTop && (
                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 ${stock.tagTopColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                        stock.tagTopColor === 'rose' ? 'bg-rose-50 text-rose-700 border border-rose-100/50' : 'bg-blue-50 text-blue-700 border border-blue-100/50'
                        }`}>
                        {stock.tagTop}
                    </div>
                )}
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3 mb-3 text-[13px] text-slate-600 font-medium leading-relaxed border border-slate-100/50 space-y-2.5">
                <div>
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">Alert Trigger</span>
                    <div className="text-slate-600 font-medium">{stock.insight}</div>
                </div>
                <div className="pt-2.5 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">Alert</span>
                    <div className="text-slate-800 font-bold">{stock.realAlert || `Target: ₹${stock.targetPrice || stock.value || 1935}`}</div>
                </div>
            </div>

            <div className="flex justify-end mt-auto">
                <button
                    onClick={() => navigate(`/investor/advanced-charts?symbol=${encodeURIComponent(stock.name.toUpperCase().replace(/\.(NS|BO)$/i, ''))}`)}
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm border border-slate-100 group-hover:border-blue-100 cursor-pointer"
                    title="View Stock Data"
                >
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

const SetAlertModal = ({ isOpen, onClose, symbol }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Bell size={18} className="text-blue-600" />
                            Manage Alerts
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Configure monitoring for {symbol}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-5 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
                    <AlertsDrawer symbol={symbol} isDark={false} />
                </div>
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 border border-blue-700 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

const GridCard = ({ stock, onRemove, customAlerts = [] }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [thesis, setThesis] = useState(stock.note || '');
    const [hasNote, setHasNote] = useState(stock.hasNote || false);
    const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

    const handleSave = () => {
        if (thesis.trim()) {
            setHasNote(true);
        } else {
            setHasNote(false);
        }
        setIsEditing(false);
    };

    // Find if user has active alerts for this stock symbol
    const userAlerts = customAlerts.filter(a => String(a.symbol).toUpperCase() === String(stock.name).toUpperCase());

    let alertBox = null;
    if (userAlerts && userAlerts.length > 0) {
        // Ensure index is within bounds
        const safeIndex = currentAlertIndex % userAlerts.length;
        const userAlert = userAlerts[safeIndex];
        
        let targetValStr = String(userAlert.value).trim();
        const currentPriceVal = Number(String(stock.price).replace(/[^0-9.]/g, ''));

        let proximityPercent = 0;
        let awayPercent = 0;
        let displayValue = targetValStr;
        let showProgressBar = false;

        if (userAlert.type === 'price') {
            const parsedTarget = Number(targetValStr.replace(/[^0-9.]/g, ''));
            if (!isNaN(parsedTarget) && parsedTarget > 0 && currentPriceVal > 0) {
                const diff = Math.abs(currentPriceVal - parsedTarget);
                awayPercent = Math.round((diff / currentPriceVal) * 100);
                proximityPercent = Math.max(0, Math.min(100, 100 - awayPercent));
                displayValue = `₹${parsedTarget.toLocaleString('en-IN')}`;
                showProgressBar = true;
            }
        } else if (userAlert.type === 'percent') {
            displayValue = `${targetValStr}%`;
        }

        const handleNextAlert = (e) => {
            e.stopPropagation();
            setCurrentAlertIndex((prev) => (prev + 1) % userAlerts.length);
        };
        
        const handlePrevAlert = (e) => {
            e.stopPropagation();
            setCurrentAlertIndex((prev) => (prev - 1 + userAlerts.length) % userAlerts.length);
        };

        alertBox = (
            <div className="bg-slate-50/50 border border-slate-100/60 rounded-xl p-3 mb-5 relative group/alertbox">
                <div className="flex justify-between items-center mb-1.5">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {userAlert.type === 'price' ? 'Price Target' : userAlert.type === 'percent' ? '% Change Target' : 'Alert Condition'}
                        {userAlerts.length > 1 && ` (${safeIndex + 1}/${userAlerts.length})`}
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 truncate max-w-[100px] text-right" title={displayValue}>{displayValue}</div>
                </div>

                {showProgressBar && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${proximityPercent >= 95 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${proximityPercent}%` }}></div>
                    </div>
                )}

                <div className="flex justify-between items-center mt-1">
                    <div className="text-[10px] font-medium text-slate-500">
                        {showProgressBar ? (
                            <><span className={`font-bold ${proximityPercent >= 95 ? 'text-blue-600' : 'text-slate-600'}`}>{awayPercent}% away</span> from target entry</>
                        ) : (
                            <span className="font-bold text-slate-500">Active Monitoring</span>
                        )}
                    </div>
                    
                    {userAlerts.length > 1 && (
                        <div className="flex gap-1">
                            <button 
                                onClick={handlePrevAlert}
                                className="w-5 h-5 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                title="View Previous Alert"
                            >
                                <ArrowRight size={10} className="rotate-180" />
                            </button>
                            <button 
                                onClick={handleNextAlert}
                                className="w-5 h-5 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                title="View Next Alert"
                            >
                                <ArrowRight size={10} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[16px] p-5 border border-slate-100 hover:shadow-md transition-shadow flex flex-col relative shadow-sm h-full group/card">

            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-black text-slate-800 text-[17px] leading-none mb-1.5">{stock.name}</h4>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[22px] font-bold text-slate-900 leading-none">{stock.price}</span>
                        <span className={`text-[12px] font-bold flex items-center gap-0.5 ${stock.isPositive ? 'text-blue-600' : 'text-rose-600'}`}>
                            {stock.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {stock.changeToday}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <div className="h-[20px] mb-1 flex items-center gap-2">
                        {stock.tagTopRight && (
                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${stock.tagTopRightColor === 'rose' ? 'bg-rose-50 text-rose-600 border border-rose-100/60' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {stock.tagTopRight}
                            </div>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/investor/advanced-charts?symbol=${encodeURIComponent(stock.name.toUpperCase().replace(/\.(NS|BO)$/i, ''))}`); }}
                            className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm border border-slate-100 hover:border-blue-100 cursor-pointer"
                            title="View Full Stock Dashboard"
                        >
                            <ExternalLink size={12} />
                        </button>
                    </div>
                    <div className="w-[220px] h-32 mt-1 opacity-100">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stock.sparkline} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                <YAxis hide domain={['auto', 'auto']}/>
                                <defs>
                                    <linearGradient
                                        id={`grad-grid-${stock.id}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1">
                                        <stop offset="5%" stopColor={stock.isPositive ? '#3E84F6' : '#e11d48'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={stock.isPositive ? '#3E84F6' : '#e11d48'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={stock.isPositive ? '#3E84F6' : '#e11d48'}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill={`url(#grad-grid-${stock.id})`}
                                    dot={false}
                                    activeDot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
                <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 ${stock.pe.color === 'teal' ? 'bg-blue-50 text-blue-700' :
                    stock.pe.color === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                    {stock.pe.label} : {stock.pe.value}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    Stable
                </div>
            </div>

            {alertBox}

            <div className="flex items-center gap-2 mt-auto">
                <button
                    onClick={() => setIsAlertModalOpen(true)}
                    className="flex-1 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                    Set Alert
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove && onRemove(stock.id); }}
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all shadow-sm flex items-center justify-center group/trash"
                    title="Remove from Watchlist"
                >
                    <Trash2 size={15} className="group-hover/trash:scale-110 transition-transform" />
                </button>
            </div>

            <SetAlertModal 
                isOpen={isAlertModalOpen} 
                onClose={() => setIsAlertModalOpen(false)} 
                symbol={String(stock.name).replace(/\.(NS|BO)$/i, '')} 
            />

            {hasNote && !isEditing && (
                <div className="mt-4 bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 relative group/note transition-all hover:bg-blue-50/50">
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5"><BookOpen size={12} className="text-blue-600/60" /></div>
                        <div className="text-[11px] text-blue-900/80 leading-snug pr-6 font-medium">
                            <span className="font-bold text-blue-800">Your Thesis:</span> {thesis}
                        </div>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="text-[10px] text-blue-700 hover:bg-blue-100 bg-white shadow-sm px-2 py-1 rounded font-bold absolute top-2 right-2 opacity-0 group-hover/note:opacity-100 transition-opacity">
                        Edit
                    </button>
                </div>
            )}

            {isEditing && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <textarea
                        value={thesis}
                        onChange={e => setThesis(e.target.value)}
                        autoFocus
                        placeholder="Why are you tracking this stock?"
                        className="w-full bg-transparent border border-slate-200 rounded-md p-2 text-[12px] text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 resize-none h-16 mb-2"
                    />
                    <div className="flex justify-end gap-2 text-[11px] font-bold">
                        <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700 px-3 py-1">Cancel</button>
                        <button onClick={handleSave} className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-sm">Save Note</button>
                    </div>
                </div>
            )}

            {!hasNote && !isEditing && (
                <div className="mt-4 flex items-center justify-center">
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer w-full text-center py-1">
                        + Add investment thesis
                    </button>
                </div>
            )}
        </div>
    );
};
const DrillDownModal = ({ isOpen, onClose, metric, stockList }) => {
    if (!isOpen || !metric) return null;

    const chartData = stockList.map(s => {
        let val = 0;
        if (metric.key === 'pe') {
            val = parseFloat(s.pe?.value?.replace(/[^0-9.]/g, '') || 0);
        } else {
            val = s[metric.key];
        }

        return {
            name: s.name,
            value: isNaN(val) ? 0 : val
        };
    }).sort((a, b) => metric.higherBetter ? b.value - a.value : a.value - b.value);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            {metric.icon && <metric.icon size={20} className={metric.colorClass} />}
                            {metric.name} Comparison
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">Comparing all stocks in your watchlist</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                        <Trash2 size={16} className="rotate-45" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="h-[300px] w-full mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? metric.colorHex : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-5 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase text-blue-600 tracking-wider mb-1">Stock Intelligence Insight</div>
                            <div className="text-[14px] font-bold text-slate-700 leading-relaxed">
                                <span className="text-blue-700">{chartData[0]?.name || 'N/A'}</span> {metric.insightPrefix} indicating {metric.insightSuffix} compared to others on your watchlist.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">
                        Close Analysis
                    </button>
                </div>
            </div>
        </div>
    );
};

const HeatmapTile = ({ metric, leader, onClick }) => (
    <div
        onClick={() => onClick(metric)}
        className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden h-full"
    >
        <div
            className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"
            style={{ backgroundColor: metric.colorHex }}
        ></div>

        <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{metric.name}</span>
            <metric.icon size={14} className={metric.colorClass + " opacity-60"} />
        </div>

        <div className="relative z-10">
            <div className="text-[13px] font-black text-slate-800 mb-0.5 group-hover:text-blue-700 transition-colors">{leader ? leader.name : 'N/A'}</div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-[17px] font-black ${metric.colorClass}`}>
                    {leader ? (
                        metric.key === 'pe'
                            ? (leader.pe?.value && leader.pe.value !== '...' ? leader.pe.value : '-')
                            : (leader[metric.key] != null && leader[metric.key] !== '' ? leader[metric.key] : '-')
                    ) : '-'}
                    <span className="text-[10px] ml-0.5 opacity-70">{metric.unit}</span>
                </span>
            </div>
        </div>

        <div className="mt-3 flex items-center justify-between relative z-10">
            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${metric.labelBg}`}>
                {metric.label}
            </span>
            <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-slate-100">
                <ArrowRight size={10} />
            </div>
        </div>
    </div>
);

const WatchlistHeatmap = ({ watchlist }) => {
    const [selectedMetric, setSelectedMetric] = useState(null);

    const displayData = watchlist;

    const metrics = [
        {
            key: 'delivery',
            name: 'Delivery %',
            icon: CheckCircle,
            colorClass: 'text-blue-600',
            colorHex: '#3E84F6',
            labelBg: 'bg-blue-50 text-blue-700',
            higherBetter: true,
            unit: '%',
            label: 'High Conviction',
            insightPrefix: 'shows the highest delivery volume',
            insightSuffix: 'strong investor willingness to hold for delivery'
        },
        {
            key: 'pe',
            name: 'P/E Ratio',
            icon: ShieldAlert,
            colorClass: 'text-rose-600',
            colorHex: '#e11d48',
            labelBg: 'bg-rose-50 text-rose-700',
            higherBetter: false,
            unit: 'x',
            label: 'Value Pick',
            insightPrefix: 'is trading at the lowest P/E multiplier',
            insightSuffix: 'a potential valuation advantage'
        },
        {
            key: 'beta',
            name: 'Beta (Risk)',
            icon: Activity,
            colorClass: 'text-amber-600',
            colorHex: '#f59e0b',
            labelBg: 'bg-amber-50 text-amber-700',
            higherBetter: true,
            unit: 'x',
            label: 'High Beta',
            insightPrefix: 'exhibits the highest beta on the watchlist',
            insightSuffix: 'significant volatility and market reactivity'
        },
        {
            key: 'momentum',
            name: '1M Momentum',
            icon: TrendingUp,
            colorClass: 'text-blue-600',
            colorHex: '#3E84F6',
            labelBg: 'bg-blue-50 text-blue-700',
            higherBetter: true,
            unit: '%',
            label: 'Strong Trend',
            insightPrefix: 'leads the watchlist in monthly momentum',
            insightSuffix: 'a clear sustained bullish trend'
        },
        {
            key: 'volumeScore',
            name: 'Volume Score',
            icon: Filter,
            colorClass: 'text-blue-500',
            colorHex: '#3b82f6',
            labelBg: 'bg-blue-50 text-blue-600',
            higherBetter: true,
            unit: 'x',
            label: 'High Activity',
            insightPrefix: 'is showing exceptional volume spikes',
            insightSuffix: 'increased institutional or retail interest'
        },
        {
            key: 'roe',
            name: 'ROE %',
            icon: Activity,
            colorClass: 'text-blue-700',
            colorHex: '#1d4ed8',
            labelBg: 'bg-blue-50 text-blue-800',
            higherBetter: true,
            unit: '%',
            label: 'Efficient Cap',
            insightPrefix: 'commands the highest Return on Equity',
            insightSuffix: 'superior capital efficiency and profitability'
        }
    ];

    const getLeader = (metricKey, higherBetter) => {
        if (!displayData.length) return null;
        return [...displayData].sort((a, b) => {
            let valA = 0;
            let valB = 0;

            if (metricKey === 'pe') {
                valA = parseFloat(a.pe?.value?.replace(/[^0-9.]/g, '') || 0);
                valB = parseFloat(b.pe?.value?.replace(/[^0-9.]/g, '') || 0);
            } else {
                valA = a[metricKey];
                valB = b[metricKey];
            }

            valA = isNaN(valA) ? 0 : valA;
            valB = isNaN(valB) ? 0 : valB;

            return higherBetter ? valB - valA : valA - valB;
        })[0];
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
            {metrics.map(m => (
                <HeatmapTile
                    key={m.key}
                    metric={m}
                    leader={getLeader(m.key, m.higherBetter)}
                    onClick={(metric) => setSelectedMetric(metric)}
                />
            ))}

            <DrillDownModal
                isOpen={!!selectedMetric}
                onClose={() => setSelectedMetric(null)}
                metric={selectedMetric}
                stockList={displayData}
            />
        </div>
    );
};

const MarketBehaviorMirror = ({ stats }) => {
    if (!stats || !stats.marketMirror) return null;

    const { volatility, sector, valuation } = stats.marketMirror;

    return (
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-5 md:p-6 opacity-95">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-slate-800 font-black text-[15px]">
                    <Activity size={18} className="text-blue-600" />
                    Market Behavior Mirror
                    <TooltipInfo text="Objective comparison of your watchlist metrics against broader market benchmarks (Indices)." />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Sync</span>
            </div>
            <div className="text-[11px] font-medium text-slate-500 mb-5">How your tracking list mirrors the broader index</div>

            <div className="grid grid-cols-1 gap-4">
                { }
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Volatility vs Market</div>
                            <div className="text-[13px] font-bold text-slate-800">{volatility.label}</div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black ${volatility.isHigher ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            Beta: {volatility.user}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                            <div
                                className={`h-full ${volatility.isHigher ? 'bg-rose-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(parseFloat(volatility.user) * 50, 100)}%` }}
                            ></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">Idx: 1.0</span>
                    </div>
                </div>

                { }
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Sector Mix vs Index</div>
                            <div className="text-[13px] font-bold text-slate-800">{sector.label}</div>
                        </div>
                        <PieChart size={16} className="text-blue-500 opacity-60" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-[11px] font-bold text-slate-500">Concentration:</div>
                        <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-700">{sector.top} ({sector.perc}%)</span>
                        </div>
                    </div>
                </div>

                { }
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Valuation vs Benchmark</div>
                            <div className="text-[13px] font-bold text-slate-800">{valuation.label}</div>
                        </div>
                        <BarChart3 size={16} className="text-blue-500 opacity-60" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Watchlist P/E</span>
                            <span className="text-[14px] font-black text-slate-800">{valuation.userPE}x</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Market Avg</span>
                            <span className="text-[14px] font-black text-slate-500">{valuation.marketPE}x</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Watchlist = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [watchlist, setWatchlist] = useState([]);
    const [isLoadingLive, setIsLoadingLive] = useState(true);
    const [watchlistId, setWatchlistId] = useState(null);
    const [customAlerts, setCustomAlerts] = useState(() => {
        try { return JSON.parse(localStorage.getItem('radar_active_alerts') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        const handleAlertsUpdate = () => {
            try { setCustomAlerts(JSON.parse(localStorage.getItem('radar_active_alerts') || '[]')); } catch { }
        };
        window.addEventListener('radar_alerts_updated', handleAlertsUpdate);
        return () => window.removeEventListener('radar_alerts_updated', handleAlertsUpdate);
    }, []);

    const { on } = useSocket(['ticker']);

    const SYMBOL_MAP = {
    // Indian Indices
    NIFTY: "^NSEI",
    BANKNIFTY: "^NSEBANK",
    FINNIFTY: "NIFTY_FIN_SERVICE.NS",
    MIDCPNIFTY: "NIFTY_MID_SELECT.NS",
    SENSEX: "^BSESN",

    // Currency
    USDINR: "INR=X",
    EURINR: "EURINR=X",
    GBPINR: "GBPINR=X",
    JPYINR: "JPYINR=X",

    // Major Indian Stocks
    RELIANCE: "RELIANCE.NS",
    TCS: "TCS.NS",
    INFY: "INFY.NS",
    HDFCBANK: "HDFCBANK.NS",
    ICICIBANK: "ICICIBANK.NS",
    SBIN: "SBIN.NS",
    LT: "LT.NS",
    ITC: "ITC.NS",
    KOTAKBANK: "KOTAKBANK.NS",
    AXISBANK: "AXISBANK.NS",
    BHARTIARTL: "BHARTIARTL.NS",
    ASIANPAINT: "ASIANPAINT.NS",
    HCLTECH: "HCLTECH.NS",
    WIPRO: "WIPRO.NS",
    TECHM: "TECHM.NS",
    SUNPHARMA: "SUNPHARMA.NS",
    TITAN: "TITAN.NS",
    ULTRACEMCO: "ULTRACEMCO.NS",
    MARUTI: "MARUTI.NS",
    BAJFINANCE: "BAJFINANCE.NS",
    BAJAJFINSV: "BAJAJFINSV.NS",
    NTPC: "NTPC.NS",
    POWERGRID: "POWERGRID.NS",
    ONGC: "ONGC.NS",
    TATAMOTORS: "TATAMOTORS.NS",
    ADANIENT: "ADANIENT.NS",
    ADANIPORTS: "ADANIPORTS.NS",
    JSWSTEEL: "JSWSTEEL.NS",
    HINDUNILVR: "HINDUNILVR.NS",
    NESTLEIND: "NESTLEIND.NS",
    CIPLA: "CIPLA.NS",
    DRREDDY: "DRREDDY.NS",
    APOLLOHOSP: "APOLLOHOSP.NS",
    INDUSINDBK: "INDUSINDBK.NS",
    COALINDIA: "COALINDIA.NS",
    BPCL: "BPCL.NS",
    HEROMOTOCO: "HEROMOTOCO.NS",
    EICHERMOT: "EICHERMOT.NS",
    BRITANNIA: "BRITANNIA.NS",
    GRASIM: "GRASIM.NS",
    HINDALCO: "HINDALCO.NS",
    DIVISLAB: "DIVISLAB.NS",
    UPL: "UPL.NS",
    TATASTEEL: "TATASTEEL.NS",
    SHREECEM: "SHREECEM.NS",

    // US Stocks
    AAPL: "AAPL",
    MSFT: "MSFT",
    NVDA: "NVDA",
    AMZN: "AMZN",
    GOOGL: "GOOGL",
    META: "META",
    TSLA: "TSLA",

    // Crypto
    BTC: "BTC-USD",
    ETH: "ETH-USD",
    SOL: "SOL-USD",
    DOGE: "DOGE-USD"
};

    // Normalizes a live market quote into the GridCard-compatible shape
    const normalizeToGridCard = (quote, idx) => {
        const sym = String(quote.symbol || '').replace(/\.(NS|BO)$/i, '');
        const price = Number(quote.currentPrice ?? quote.price ?? quote.ltp ?? quote.lastPrice ?? 0);
        const changePercent = Number(quote.percentChange ?? quote.changePercent ?? quote.change ?? 0);
        const isPositive = changePercent >= 0;
        const rawSparkline =
            Array.isArray(quote.sparklineData) &&
                quote.sparklineData.length > 0
                ? quote.sparklineData.slice(-100)
                : [];

        const sparkline = rawSparkline.map((item, index) => ({
            time: item.time || index,
            value: Number(item.close || 0)
        }));
        console.log("SPARKLINE FINAL:", sparkline);
        return {
            id: `live-${idx}`,
            originalSymbol: quote.symbol,
            sym: quote.symbol,
            name: sym,
            price: `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            changeToday: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
            changeTotal: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
            isPositive,
            sparkline,
            sector: quote.sector || 'Equity',
            pe: { label: 'P/E', value: quote.pe ? String(Number(quote.pe).toFixed(1)) : 'N/A', color: 'blue' },
            valStatus: quote.valStatus || 'fair',
            beta: Number(quote.beta ?? 1),
            delivery: Number(quote.deliveryPct ?? 45),
            momentum: Number(quote.momentum ?? changePercent),
            volumeScore: Number(quote.volumeRatio ?? 1),
            roe: Number(quote.roe ?? 0),
            metrics: [],
            verdict: quote.verdict || '',
            hasNote: false,
        };
    };

    useEffect(() => {
        let active = true;
        const load = async (isBackground = false) => {
            if (!isBackground) setIsLoadingLive(true);
            try {
                // 1. Fetch user's watchlist symbols
                const wlRes = await api.get('/watchlist');
                const wlData = wlRes.data?.data ?? wlRes.data;
                const symbols = (Array.isArray(wlData)
                    ? wlData.flatMap(w => (w.items ? w.items.map(i => i.symbol) : (w.symbols ?? w.stocks ?? [])))
                    : []).filter(Boolean);

                if (Array.isArray(wlData) && wlData.length > 0) {
                    setWatchlistId(wlData[0]._id || wlData[0].id);
                }

                if (!symbols.length || !active) { if (!isBackground) setIsLoadingLive(false); return; }

                // 2. Fetch live quotes for all symbols
                const symbolStr = symbols.join(',');
                const mktRes = await api.get(`/market/quotes?symbols=${encodeURIComponent(symbolStr)}`);
                const quotes = mktRes.data?.data ?? mktRes.data;
                const quotesWithCharts = await Promise.all(
                    quotes.map(async (quote) => {
                        try {
                            //let chartSymbol = quote.symbol;
                            const cleanSymbol = String(quote.symbol || '').replace(/\.(NS|BO)$/i, '');

                            const chartSymbol = SYMBOL_MAP[cleanSymbol] || quote.symbol;
                            //const chartSymbol = SYMBOL_MAP[quote.symbol] || quote.symbol;
                            const chartRes = await api.get(
                                `/stocks/${encodeURIComponent(
                                    chartSymbol
                                )}/chart?timeframe=5D`
                            );
                            console.log("CHART DATA:", chartRes.data);
                            return {
                                ...quote,
                                sparklineData: chartRes.data.data
                            };

                        } catch (err) {

                            console.error("Chart fetch failed:", quote.symbol);

                            return {
                                ...quote,
                                sparklineData: []
                            };
                        }
                    })
                );



                if (Array.isArray(quotesWithCharts) && quotesWithCharts.length && active) {
                    setWatchlist(quotesWithCharts.map(normalizeToGridCard));
                } else if (active && (!symbols.length || !quotes.length)) {
                    // Keep the default mocks if no symbols found in backend
                    console.log("No symbols in backend, keeping mocks.");
                }
            } catch (err) {
                console.warn('Investor Watchlist live load failed, keeping mock data:', err.message);
                // We don't call setWatchlist([]) here, so the initial mocks stay visible
            } finally {
                if (active && !isBackground) setIsLoadingLive(false);
            }
        };
        load(false);
        const timer = setInterval(() => load(true), 20000);
        const handleWatchlistUpdate = () => { if(active) load(true); };
        window.addEventListener('watchlist_updated', handleWatchlistUpdate);
        return () => { active = false; clearInterval(timer); window.removeEventListener('watchlist_updated', handleWatchlistUpdate); };
    }, []);

    // Handle real-time WebSocket updates
    useEffect(() => {
        on('price_update', (event) => {
            if (!event.symbol) return;

            const eventSym = String(event.symbol).replace(/\.(NS|BO)$/i, '').toUpperCase();

            setWatchlist(prev => {
                const targetIdx = prev.findIndex(s => s.name.toUpperCase() === eventSym);
                if (targetIdx === -1) return prev;

                const next = [...prev];
                const item = next[targetIdx];
                const price = Number(event.price);
                const change = Number(event.change || item.changeToday.replace(/[^0-9.-]/g, ''));
                const isPositive = change >= 0;

                next[targetIdx] = {
                    ...item,
                    price: `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    changeToday: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
                    isPositive,
                };
                return next;
            });
        });
    }, [on]);

    const stats = React.useMemo(() => {
        const displayData = watchlist;

        if (displayData.length === 0) {
            return {
                total: 0,
                avgPE: 'N/A',
                gains: 0,
                losses: 0,
                valuation: { label: 'N/A', breakdown: 'ADD STOCKS TO VIEW', color: 'slate' },
                risk: { label: 'N/A', avgBeta: 'N/A', insight: 'No data available', color: 'slate' },
                marketMirror: {
                    volatility: {
                        user: 'N/A',
                        market: "1.00",
                        isHigher: false,
                        label: 'Add stocks to view'
                    },
                    sector: {
                        top: 'N/A',
                        perc: 0,
                        isConcentrated: false,
                        label: 'Add stocks to view'
                    },
                    valuation: {
                        userPE: 'N/A',
                        marketPE: 22.5,
                        isHigher: false,
                        label: 'Add stocks to view'
                    }
                }
            };
        }

        const total = displayData.length;
        const counts = { undervalued: 0, fair: 0, overvalued: 0 };
        let totalPE = 0;
        let validPECount = 0;

        displayData.forEach(s => {
            if (counts[s.valStatus] !== undefined) counts[s.valStatus]++;
            else counts.fair++;

            const peValue = s.pe?.value ? parseFloat(s.pe.value.replace(/[^0-9.]/g, '')) : NaN;
            if (!isNaN(peValue)) {
                totalPE += peValue;
                validPECount++;
            }
        });

        const avgPE = validPECount > 0 ? (totalPE / validPECount).toFixed(1) : "21.5";

        const percs = {
            undervalued: Math.round((counts.undervalued / total) * 100),
            fair: Math.round((counts.fair / total) * 100),
            overvalued: Math.round((counts.overvalued / total) * 100)
        };

        let valStatusLabel = "Mixed Valuation";
        let valColorKey = "amber";
        if (percs.undervalued > 50) { valStatusLabel = "Undervalued Opportunity"; valColorKey = "blue"; }
        else if (counts.fair > total / 2) { valStatusLabel = "Fairly Valued"; valColorKey = "amber"; }
        else if (percs.overvalued > 50) { valStatusLabel = "Overvalued Zone"; valColorKey = "rose"; }

        const avgBeta = displayData.reduce((acc, s) => acc + (s.beta || 1), 0) / total;
        let riskLabel = "Moderate Risk";
        let riskColorKey = "amber";
        if (avgBeta < 0.8) { riskLabel = "Low Risk"; riskColorKey = "blue"; }
        else if (avgBeta > 1.2) { riskLabel = "High Risk"; riskColorKey = "rose"; }

        const sectorCounts = {};
        displayData.forEach(s => {
            const sec = s.sector || 'Others';
            sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
        });
        const topSector = Object.keys(sectorCounts).reduce((a, b) => sectorCounts[a] > sectorCounts[b] ? a : b);
        const topSectorPerc = Math.round((sectorCounts[topSector] / total) * 100);

        const benchmarkPE = 22.5;
        const benchmarkTopSector = "Banking";

        return {
            total: watchlist.length,
            avgPE,
            gains: displayData.filter(s => s.isPositive).length,
            losses: displayData.filter(s => !s.isPositive).length,
            valuation: {
                label: valStatusLabel,
                colorKey: valColorKey,
                breakdown: `${percs.fair}% Fair • ${percs.overvalued}% Over • ${percs.undervalued}% Under`
            },
            risk: {
                label: riskLabel,
                colorKey: riskColorKey,
                avgBeta: avgBeta.toFixed(2),
                insight: avgBeta > 1.05 ? "More volatile than market" : (avgBeta < 0.95 ? "Less volatile than market" : "Market-aligned volatility")
            },
            marketMirror: {
                volatility: {
                    user: avgBeta.toFixed(2),
                    market: "1.00",
                    isHigher: avgBeta > 1.0,
                    label: avgBeta > 1.05 ? "More volatile than market" : (avgBeta < 0.95 ? "Lower volatility vs Index" : "Market Neutral")
                },
                sector: {
                    top: topSector,
                    perc: topSectorPerc,
                    isConcentrated: topSector === benchmarkTopSector ? false : topSectorPerc > 30,
                    label: topSectorPerc > 30 ? `${topSector}-heavy compared to index` : "Diversified sector mix"
                },
                valuation: {
                    userPE: avgPE,
                    marketPE: benchmarkPE,
                    isHigher: parseFloat(avgPE) > benchmarkPE,
                    label: parseFloat(avgPE) > benchmarkPE ? "Premium valuation vs Market" : "Discounted P/E vs Benchmark"
                }
            }
        };
    }, [watchlist]);

    const [proximityAlerts, setProximityAlerts] = useState(null);

    useEffect(() => {
        let active = true;
        const fetchProximity = async () => {
            try {
                const res = await api.post('/alerts/proximity', { localAlerts: customAlerts });
                if (active && res.data?.success && Array.isArray(res.data?.data)) {
                    setProximityAlerts(res.data.data);
                } else if (active) {
                    setProximityAlerts([]);
                }
            } catch (err) {
                console.warn('Proximity engine fetch failed, falling back to empty state:', err.message);
                if (active && proximityAlerts === null) {
                    setProximityAlerts([]);
                }
            }
        };
        fetchProximity();
        return () => { active = false; };
    }, [customAlerts]);

    const dynamicAttentionStocks = React.useMemo(() => {
        if (proximityAlerts !== null) {
            return proximityAlerts.map(a => ({
                id: a.id,
                name: a.symbol,
                price: a.price,
                change: a.change,
                isPositive: a.isPositive,
                tagTop: a.tagTop || 'Price Alert',
                tagTopColor: a.tagTopColor || 'blue',
                insight: a.insight || `${a.symbol} proximity score: ${a.progressPercent}% (${a.priority} Priority).`,
                realAlert: a.realAlert || `Target: ₹${a.targetPrice || 1935}`
            }));
        }

        return [];
    }, [proximityAlerts]);

    const [recentChangesData, setRecentChangesData] = useState(null);

    useEffect(() => {
        let active = true;
        const fetchRecentChanges = async () => {
            if (!watchlist || !watchlist.length) return;
            try {
                const symbols = watchlist.map(w => w.sym || w.name || w.symbol);
                const res = await api.post('/watchlist/recent-changes', { symbols });
                if (active && res.data?.success && Array.isArray(res.data?.data)) {
                    setRecentChangesData(res.data.data);
                }
            } catch (err) {
                console.warn('Recent changes fetch failed:', err.message);
            }
        };
        fetchRecentChanges();
        const interval = setInterval(fetchRecentChanges, 60000); // refresh every minute
        return () => { active = false; clearInterval(interval); };
    }, [watchlist]);

    const dynamicRecentChanges = React.useMemo(() => {
        if (recentChangesData !== null && recentChangesData.length > 0) {
            return recentChangesData.slice(0, 4);
        }

        if (!watchlist || !watchlist.length) return [];
        return [...watchlist]
            .slice(0, 3)
            .map((s, i) => {
                const changes = [
                    { title: `${s.name} Positive MACD`, desc: `MACD line crossed above the signal line on the daily chart, showing building bullish momentum.`, type: 'positive' },
                    { title: `${s.name} Low %B (Bollinger)`, desc: `Bollinger %B indicator dropped below 0, suggesting the stock is heavily oversold in the short term.`, type: 'negative' },
                    { title: `${s.name} RSI Oversold`, desc: `RSI (14) dropped below 30, indicating a potential reversal zone.`, type: 'amber' },
                    { title: `${s.name} Supertrend Buy`, desc: `Supertrend indicator flipped to positive, triggering a technical buy signal.`, type: 'positive' }
                ];
                const change = changes[i % changes.length];

                return {
                    title: change.title,
                    desc: change.desc,
                    type: change.type,
                    date: 'Today',
                    time: i === 0 ? 'Live' : (i === 1 ? '30 Mins ago' : '2 Hrs ago')
                };
            });
    }, [recentChangesData, watchlist]);

    const handleRemoveFromWatchlist = async (stockSymbol) => {
        // Optimistic UI update
        const backup = [...watchlist];
        setWatchlist(prev => prev.filter(s => s.name !== stockSymbol && s.sym !== stockSymbol));

        if (!watchlistId) return;
        try {
            await api.delete(`/watchlist/${watchlistId}/remove/${encodeURIComponent(stockSymbol)}`);
        } catch (err) {
            console.error('Failed to remove stock from backend:', err);
            // Optional: revert if absolutely necessary, but usually better to stay optimistic
            // setWatchlist(backup);
        }
        window.dispatchEvent(new Event('watchlist_updated'));
    };

    const handleAddToWatchlist = async (stockSymbol) => {
        // Optimistic UI: Add a placeholder immediately
        const placeholder = {
            id: Date.now(),
            name: stockSymbol.split('.')[0],
            sym: stockSymbol,
            price: '₹...',
            changeToday: '...',
            isPositive: true,
            pe: { value: '...' },
            valStatus: 'fair',
            beta: 1.0,
            delivery: null,
            momentum: null,
            volumeScore: null,
            roe: null,
            sector: 'Equity',
            sparkline: mockSparklinePositive
        };
        setWatchlist(prev => [...prev, placeholder]);

        if (!watchlistId) return;
        try {
            await api.post(`/watchlist/${watchlistId}/add`, { symbol: stockSymbol });
            // Fetch live data to replace placeholder
            const mktRes = await api.get(`/market/quotes?symbols=${encodeURIComponent(stockSymbol)}`);
            const quotes = mktRes.data?.data ?? mktRes.data;
            if (Array.isArray(quotes) && quotes.length > 0) {
                setWatchlist(prev => prev.map(s => s.id === placeholder.id ? normalizeToGridCard(quotes[0], prev.length) : s));
            }
        } catch (err) {
            console.error('Failed to add stock to backend:', err);
            // Optional: revert placeholder on failure
            // setWatchlist(prev => prev.filter(s => s.id !== placeholder.id));
        }
        window.dispatchEvent(new Event('watchlist_updated'));
    };

    const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

    return (
        <div className="w-full min-h-screen py-6">
            { }

            <div className="fade-in w-full min-h-screen relative px-4 md:px-10">

                <div className="mb-16">
                    { }
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
                        <div>
                            <h2 className="text-[26px] font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <Bookmark size={24} className="text-blue-600 hidden sm:block" />
                                Intelligence Watchlist
                            </h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Your decision-support command center.</p>
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* Loading state */}
                        {isLoadingLive && (
                            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[20px] border border-slate-100 shadow-sm min-h-[400px]">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <div className="text-slate-800 font-bold mb-1">Syncing Intelligence Hub</div>
                                <div className="text-slate-500 text-[12px]">Connecting to live market feeds...</div>
                            </div>
                        )}

                        {/* Full dashboard — always shown */}
                        {!isLoadingLive && (
                            <>
                                {/* Watchlist Overview */}
                                <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-5 md:p-6">
                                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center">
                                        Watchlist Overview
                                        <TooltipInfo text="High-level aggregate metrics representing the overall performance and status of all stocks currently in your watchlist." />
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tracked</div>
                                                <div className="text-2xl font-black text-slate-800">{stats?.total || 0} <span className="text-xs font-bold text-slate-500">Stk</span></div>
                                            </div>
                                            <div className="flex items-end gap-1 flex-col text-[10px] font-bold">
                                                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{stats?.gains || 0} Gain</span>
                                                <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{stats?.losses || 0} Loss</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                                                    Watchlist Valuation Snapshot
                                                    <TooltipInfo text="Based on valuation classification of tracked stocks" />
                                                </div>
                                                <div className="text-lg font-black text-slate-800">{stats?.valuation?.label || 'N/A'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{stats?.valuation?.breakdown || '-'}</div>
                                            </div>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${stats?.valuation?.colorKey === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                stats?.valuation?.colorKey === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                                                }`}>
                                                {stats?.valuation?.label === "Undervalued Opportunity" ? <TrendingUp size={18} /> : stats?.valuation?.label === "Overvalued Zone" ? <TrendingDown size={18} /> : <CheckCircle size={18} />}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                                                    Watchlist Risk Level
                                                    <TooltipInfo text="Based on average beta (volatility vs market)" />
                                                </div>
                                                <div className="text-lg font-black text-slate-800">
                                                    {stats?.risk?.label || 'N/A'} {stats?.risk?.avgBeta && <span className="text-xs font-bold text-slate-500">({stats?.risk?.avgBeta}x beta)</span>}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 italic pr-2">"{stats?.risk?.insight || 'Add stocks to view insights'}"</div>
                                            </div>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${stats?.risk?.colorKey === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                stats?.risk?.colorKey === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    stats?.risk?.colorKey === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                                                }`}>
                                                <Activity size={18} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-200 transition-colors group">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Needs Attention</div>
                                                <div className="text-2xl font-black text-amber-600">{dynamicAttentionStocks.length} <span className="text-[11px] font-bold opacity-70 text-slate-500">Alerts</span></div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-100/50">
                                                <AlertTriangle size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* What Needs Attention + Recent Changes */}
                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="lg:w-[65%] bg-white rounded-[20px] shadow-sm border border-slate-100 p-5 md:p-6 transition-all">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-[15px] font-black text-slate-800 flex items-center gap-2">
                                                <AlertTriangle size={18} className="text-amber-500" />
                                                What Needs Attention
                                                <TooltipInfo text="Stocks that have triggered a predefined manual or system-level alert requiring immediate review by the investor." />
                                            </h3>
                                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">Priority Review</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {dynamicAttentionStocks.length > 0 ? dynamicAttentionStocks.map(stock => (
                                                <AttentionCard key={stock.id} stock={stock} />
                                            )) : (
                                                <div className="col-span-1 md:col-span-3 py-8 text-center text-slate-500 text-[13px] font-medium border border-dashed border-slate-200 rounded-xl">
                                                    All clear — no stocks require immediate attention.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:w-[35%] bg-white rounded-[20px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col h-full min-h-[380px]">
                                        <h3 className="text-[16px] font-black text-slate-800 mb-6 flex items-center gap-2">
                                            <Activity size={18} className="text-blue-500" />
                                            Recent Changes
                                            <TooltipInfo text="A chronological activity log of objective, factual events affecting the stocks on your watchlist." />
                                        </h3>
                                        <div className="flex-grow space-y-6">
                                            {dynamicRecentChanges.length > 0 ? dynamicRecentChanges.map((change, i) => (
                                                <div key={i} className="flex gap-4 relative">
                                                    <div className="mt-1.5 flex flex-col items-center">
                                                        {change.type === 'positive' ? <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-50 relative z-10"></div> :
                                                            change.type === 'negative' ? <div className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-50 relative z-10"></div> :
                                                                <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-50 relative z-10"></div>}
                                                        {i !== dynamicRecentChanges.length - 1 && <div className="w-px h-full bg-slate-100 absolute top-4"></div>}
                                                    </div>
                                                    <div className="pb-2 w-full">
                                                        <div className="flex justify-between items-start w-full">
                                                            <div className="text-[14px] font-bold text-slate-800">{change.title}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wide">{change.date}, {change.time}</div>
                                                        </div>
                                                        <div className="text-[12px] font-medium text-slate-500 leading-relaxed mt-1.5 pr-2">{change.desc}</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-8 text-center text-slate-500 text-[13px] font-medium border border-dashed border-slate-200 rounded-xl h-full flex items-center justify-center">
                                                    No recent market changes.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Watchlist Holdings grid */}
                                <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                        <h3 className="text-[15px] font-black text-slate-800 flex items-center">
                                            Watchlist Holdings
                                            <TooltipInfo text="Your primary grid of tracked stocks, displaying real-time technicals, valuations, and customized target proximity bars." />
                                        </h3>
                                    </div>
                                    {watchlist.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {watchlist.map(stock => (
                                                <GridCard
                                                    key={stock.id}
                                                    stock={stock}
                                                    customAlerts={customAlerts}
                                                    onRemove={() => handleRemoveFromWatchlist(stock.sym)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-16 text-slate-400 font-medium text-sm border border-dashed border-slate-200 rounded-2xl">
                                            No companies in watchlist
                                        </div>
                                    )}
                                </div>

                                {/* Market Behavior Mirror + Heatmap */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <MarketBehaviorMirror stats={stats} />

                                    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-5 md:p-6 opacity-95">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 text-slate-800 font-black text-[15px]">
                                                <SlidersHorizontal size={18} className="text-slate-500" />
                                                Watchlist Heatmap Insights
                                                <TooltipInfo text="A compact, interactive comparison of your watchlist stocks across key fundamental and technical metrics." />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Research Tool</span>
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-500 mb-5">Click any tile to compare all tracked stocks</div>
                                        <div className="h-[250px] sm:h-[300px]">
                                            {watchlist.length > 0 ? (
                                                <WatchlistHeatmap watchlist={watchlist} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-xl">
                                                    Add stocks to view heatmap
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Watchlist;
