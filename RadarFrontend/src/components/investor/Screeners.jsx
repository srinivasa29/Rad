import React, { useState } from 'react';
import { 
    Filter, 
    Star, 
    TrendingUp, 
    Users, 
    Activity, 
    BarChart3, 
    Banknote, 
    ShieldCheck, 
    ChevronRight,
    Search,
    SlidersHorizontal,
    Plus,
    X,
    Info,
    Check
} from 'lucide-react';

const mockReadyMade = [
    { id: 1, title: 'Consistent Growers', desc: 'Companies with 15%+ profit growth over 3 years.', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, title: 'Strong Financials', desc: 'Low debt, high cash flow and solid margins.', icon: Banknote, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 3, title: 'Value Picks', desc: 'Fundamentally strong stocks trading below intrinsic value.', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 4, title: 'Near 52W Low', desc: 'Stocks trading close to their 52-week support levels.', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 5, title: 'High Volume Movers', desc: 'Unusual trading volume with positive price action.', icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50' }
];

const mockTrending = [
    { id: 1, title: 'IT Sector Breakouts', desc: 'Tech stocks crossing 200-DMA', users: '2.4k' },
    { id: 2, title: 'High Dividend Giants', desc: 'Yield > 4% with stable payouts', users: '1.8k' },
    { id: 3, title: 'FMCG Defensive Play', desc: 'Low beta, high ROE screening', users: '950' },
];

const mockResults = [
    { id: 'TCS', name: 'Tata Consultancy Services', price: '₹3,542.10', change: '+1.2%', isPositive: true, sector: 'IT Services' },
    { id: 'HINDUNILVR', name: 'Hindustan Unilever', price: '₹2,410.50', change: '-0.4%', isPositive: false, sector: 'FMCG' },
    { id: 'ITC', name: 'ITC Limited', price: '₹415.80', change: '+2.1%', isPositive: true, sector: 'FMCG' },
    { id: 'INFY', name: 'Infosys Ltd', price: '₹1,440.00', change: '+0.8%', isPositive: true, sector: 'IT Services' },
];


const Screeners = () => {
    const [marketCap, setMarketCap] = useState('Large');
    const [industry, setIndustry] = useState(['Tech', 'Finance']);
    const [activeScreener, setActiveScreener] = useState(null);
    const currentTheme = 'blue';
    const setCurrentTheme = () => {}; // No-op to prevent breakages if called elsewhere

    React.useEffect(() => {
        const style = document.createElement('style');
        style.id = 'screeners-component-styles';
        style.innerHTML = `
            /* Slider glossy styling */
            input[type="range"].screener-slider {
                -webkit-appearance: none;
                width: 100%;
                height: 6px;
                background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
                border-radius: 8px;
                outline: none;
                box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
            }
            
            input[type="range"].screener-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid #3b82f6;
                box-shadow: 0 4px 10px rgba(59,130,246,0.3), inset 0 1px 1px rgba(255,255,255,0.9);
                cursor: pointer;
                transition: all 0.2s;
            }

            input[type="range"].screener-slider::-webkit-slider-thumb:hover {
                transform: scale(1.15);
                box-shadow: 0 5px 15px rgba(59,130,246,0.4), inset 0 1px 1px rgba(255,255,255,0.9);
            }
        `;
        document.head.appendChild(style);

        return () => {
            const el = document.getElementById('screeners-component-styles');
            if (el) document.head.removeChild(el);
        };
    }, []);

    const handleIndustryToggle = (ind) => {
        setIndustry(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
    };

    const handleScreenerClick = (id) => {
        setActiveScreener(id === activeScreener ? null : id);
    };

    // Card Glassmorphism Framework
    const baseCardClass = "bg-[rgba(255,255,255,0.85)] backdrop-blur-[10px] rounded-[20px] border border-[rgba(255,255,255,0.4)] shadow-[0_20px_50px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] p-7 mb-8";
    const sectionTitleClass = "text-[20px] font-[700] text-[#1e293b] flex items-center mb-6 pl-3 border-l-[3px] border-[#3b82f6]";
    
    // Dynamic Focus Panel
    const rightPanelClass = "bg-[rgba(255,255,255,0.92)] backdrop-blur-[12px] rounded-[22px] border border-[rgba(255,255,255,0.5)] shadow-[0_30px_60px_rgba(0,0,0,0.1),0_10px_40px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] p-7 mb-8 transition-all duration-300";

    const btnGradientHoverClass = "w-full mt-8 py-[14px] rounded-[14px] bg-gradient-to-r from-[#3b82f6] to-[#1e40af] text-white font-[700] text-[15px] shadow-[0_10px_25px_rgba(59,130,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-300 flex justify-center items-center gap-2 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(59,130,246,0.45)] active:scale-[0.98]";

    return (
        <div className="w-full min-h-screen py-8 px-4 md:px-10 bg-transparent transition-all duration-500">
            <div className="w-full mx-auto fade-in">
                
                {/* Header & Theme Palette Selector */}
                <div className="mb-12 flex justify-between items-start">
                    <div>
                        <h1 className="text-[34px] font-black text-[#1e293b] mb-2 tracking-tight drop-shadow-sm">Screeners</h1>
                        <p className="text-[#64748b] font-semibold text-[15px]">Filter the market based on precise criteria. Build your ultimate radar.</p>
                    </div>
                    
                    {}
                </div>

                <div className="flex flex-col xl:flex-row gap-10">
                    {/* LEFT COLUMN (65%) */}
                    <div className="w-full xl:w-[65%] flex flex-col">
                        
                        {/* Ready Made Screeners */}
                        <div className={baseCardClass}>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className={sectionTitleClass}>
                                    Ready-made Screeners
                                </h2>
                                <button className="text-[14px] font-bold text-[#3b82f6] hover:text-[#1d4ed8] transition-colors -mt-6">View All</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                {mockReadyMade.map(item => {
                                    const isActive = activeScreener === item.id;
                                    return (
                                    <div 
                                        key={item.id}
                                        onClick={() => handleScreenerClick(item.id)}
                                        className={`group cursor-pointer p-[20px] rounded-[18px] transition-all duration-[300ms] ease hover:-translate-y-[4px] hover:scale-[1.02] hover:shadow-[0_15px_35px_rgba(0,0,0,0.06),0_10px_20px_rgba(59,130,246,0.08)] border ${isActive ? 'bg-[rgba(255,255,255,0.95)] border-[rgba(59,130,246,0.6)] shadow-[0_10px_25px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/10' : 'bg-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.6)] shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:border-[rgba(255,255,255,1)] hover:bg-[rgba(255,255,255,0.9)]'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-[14px] shadow-sm ${item.bg} ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                                                {isActive ? <Check size={20} strokeWidth={3} className="text-[#3b82f6]" /> : <item.icon size={20} strokeWidth={2.5} />}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-[15px] mb-1.5 transition-colors ${isActive ? 'text-[#3b82f6]' : 'text-[#1e293b] group-hover:text-[#3b82f6]'}`}>{item.title}</h3>
                                                <p className="text-[13px] text-[#64748b] leading-relaxed line-clamp-2">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Trending Screeners */}
                        <div className={baseCardClass}>
                            <h2 className={sectionTitleClass}>
                                Trending Screeners
                            </h2>
                            <div className="space-y-3">
                                {mockTrending.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center justify-between p-[16px] bg-[rgba(255,255,255,0.6)] rounded-[16px] border border-transparent hover:border-[rgba(255,255,255,0.9)] cursor-pointer transition-all duration-[300ms] ease hover:-translate-y-1 hover:bg-[rgba(255,255,255,0.85)] hover:scale-[1.01] group shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.06)]"
                                    >
                                        <div>
                                            <div className="font-[700] text-[15px] text-[#1e293b] group-hover:text-[#3b82f6] transition-colors">{item.title}</div>
                                            <div className="text-[13px] text-[#64748b] font-medium mt-1">{item.desc}</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px] font-[800] text-[#64748b] bg-[rgba(255,255,255,0.9)] group-hover:text-[#3b82f6] px-[12px] py-[6px] rounded-full transition-colors border border-[rgba(0,0,0,0.03)] group-hover:border-[rgba(59,130,246,0.2)] shadow-sm">
                                            <Users size={14} className="opacity-75" />
                                            {item.users}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Screener Results */}
                        <div className={baseCardClass}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h2 className={sectionTitleClass.replace('mb-6', 'mb-0')}>
                                    Live Results <span className="text-[13px] font-[700] text-[#64748b] ml-3 tracking-normal bg-[rgba(255,255,255,0.8)] border border-[rgba(255,255,255,0.9)] px-[10px] py-[4px] shadow-sm rounded-full inline-block">14 matches</span>
                                </h2>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search tickers..." 
                                        className="pl-10 pr-4 py-2.5 bg-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.5)] rounded-[14px] text-sm focus:outline-none focus:border-[#3b82f6] focus:bg-[rgba(255,255,255,0.9)] focus:ring-[2px] focus:ring-[#3b82f6]/20 transition-all font-[600] w-full sm:w-64 text-[#1e293b]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {mockResults.map(stock => (
                                    <div 
                                        key={stock.id} 
                                        className="p-[20px] rounded-[18px] bg-[rgba(255,255,255,0.85)] border border-[rgba(255,255,255,0.6)] shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-[300ms] ease hover:-translate-y-1.5 hover:border-[rgba(255,255,255,1)] hover:shadow-[0_20px_45px_rgba(59,130,246,0.15),0_0_20px_rgba(59,130,246,0.08)] group flex flex-col justify-between"
                                    >
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <h3 className="font-black text-[17px] text-[#1e293b] group-hover:text-[#3b82f6] transition-colors">{stock.id}</h3>
                                                <p className="text-[13px] text-[#64748b] font-[600] mt-0.5">{stock.name}</p>
                                                <span className="inline-block mt-3 text-[11px] font-[800] text-[#64748b] bg-[rgba(255,255,255,0.7)] px-3 py-1 rounded-[8px] border border-[rgba(255,255,255,0.8)] shadow-sm">{stock.sector}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-extrabold text-[16px] text-[#1e293b]">{stock.price}</div>
                                                <div className={`text-[13px] font-[800] ${stock.isPositive ? 'text-[#3E84F6] bg-[#3E84F6]/10' : 'text-[#f43f5e] bg-[#f43f5e]/10'} inline-block px-2 py-0.5 rounded-[6px] mt-1.5 shadow-sm`}>{stock.change}</div>
                                            </div>
                                        </div>
                                        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-[14px] font-[800] text-[#3b82f6] bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.15)] hover:bg-[#3b82f6] hover:text-white transition-all duration-300 hover:shadow-[0_8px_20px_rgba(59,130,246,0.25)] hover:scale-[1.02] active:scale-[0.98]">
                                            <Plus size={16} strokeWidth={3} />
                                            Add to Watchlist
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (35%) */}
                    <div className="w-full xl:w-[35%] flex flex-col">
                        <div className="sticky top-[100px] z-20 flex flex-col h-fit">
                        
                        {/* Custom Builder (Primary Focus) */}
                        <div className={rightPanelClass}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-[20px] font-black text-[#1e293b] flex items-center gap-2 drop-shadow-sm">
                                    <SlidersHorizontal size={20} className="text-[#3b82f6]" />
                                    Custom Screener Builder
                                </h2>
                                <button className="text-[13px] font-[800] text-[#94a3b8] hover:text-[#f43f5e] hover:bg-rose-50 px-[10px] py-[6px] rounded-[8px] transition-all flex items-center gap-1.5 shadow-sm border border-transparent hover:border-rose-100">
                                    <X size={14} strokeWidth={3} /> Clear
                                </button>
                            </div>

                            <div className="space-y-7 max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar">
                                {/* Market Cap Toggle */}
                                <div>
                                    <label className="block text-[14px] font-[800] text-[#1e293b] mb-3">Market Cap</label>
                                    <div className="flex bg-[rgba(255,255,255,0.65)] p-1.5 rounded-[14px] border border-[rgba(255,255,255,0.5)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                        {['Small', 'Mid', 'Large'].map(cap => (
                                            <button 
                                                key={cap}
                                                onClick={() => setMarketCap(cap)}
                                                className={`flex-1 py-2 text-[13px] font-[800] rounded-[10px] transition-all duration-300 ${marketCap === cap ? 'bg-white text-[#3b82f6] shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-[rgba(255,255,255,0.8)] scale-[1.02]' : 'text-[#64748b] hover:text-[#1e293b] hover:bg-[rgba(255,255,255,0.8)]'}`}
                                            >
                                                {cap}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sliders */}
                                {[
                                    { label: 'P/E Ratio', min: '0', max: '50+' },
                                    { label: 'Price Change % (1Y)', min: '-50%', max: '+100%' },
                                    { label: 'Debt to Equity', min: '0', max: '3.0' },
                                    { label: 'Return on Equity (ROE)', min: '0%', max: '30%+' }
                                ].map(slider => (
                                    <div key={slider.label}>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[14px] font-[800] text-[#1e293b]">{slider.label}</label>
                                            <span className="text-[12px] font-[900] text-[#3b82f6] bg-blue-50/80 px-3 py-1 rounded-full border border-blue-100 shadow-sm backdrop-blur-[4px]">Any</span>
                                        </div>
                                        <div className="py-2">
                                            <input type="range" className="screener-slider" />
                                        </div>
                                        <div className="flex justify-between text-[11px] font-[700] text-[#94a3b8] mt-2">
                                            <span>{slider.min}</span>
                                            <span>{slider.max}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Industry Chips */}
                                <div>
                                    <label className="block text-[14px] font-[800] text-[#1e293b] mb-3">Industry</label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {['Tech', 'Finance', 'FMCG', 'Auto', 'Energy', 'Healthcare'].map(ind => {
                                            const isSelected = industry.includes(ind);
                                            return (
                                                <button 
                                                    key={ind}
                                                    onClick={() => handleIndustryToggle(ind)}
                                                    className={`px-[16px] py-[8px] rounded-full text-[13px] font-[800] transition-all duration-300 border ${isSelected ? 'bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white border-transparent shadow-[0_8px_16px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] scale-[1.05]' : 'bg-[rgba(255,255,255,0.8)] text-[#64748b] border-[rgba(255,255,255,0.9)] hover:border-[#3b82f6]/40 hover:text-[#1e293b] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.1)]'}`}
                                                >
                                                    {ind}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button className={btnGradientHoverClass}>
                                Show Results
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Radar Intelligence Card */}
                        <div className={baseCardClass}>
                            <h2 className="text-[15px] font-[800] text-[#1e293b] flex items-center gap-2 mb-5 border-l-[3px] border-amber-400 pl-2">
                                <Info size={18} className="text-amber-500" />
                                Why These Match
                            </h2>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <div className="mt-1.5 w-[6px] h-[6px] rounded-full bg-[#3b82f6] shrink-0 border border-[#3b82f6]/20 ring-[3px] ring-[#3b82f6]/10"></div>
                                    <p className="text-[13px] text-[#64748b] leading-relaxed font-[600]">
                                        <strong className="text-[#1e293b]">High ROE</strong> indicates efficient capital usage by management to generate profits.
                                    </p>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="mt-1.5 w-[6px] h-[6px] rounded-full bg-[#3b82f6] shrink-0 border border-[#3b82f6]/20 ring-[3px] ring-[#3b82f6]/10"></div>
                                    <p className="text-[13px] text-[#64748b] leading-relaxed font-[600]">
                                        <strong className="text-[#1e293b]">Low debt</strong> suggests financial stability, reducing risk in high-rate environments.
                                    </p>
                                </li>
                            </ul>
                        </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default Screeners;
