import React from 'react';
import { Bookmark, TrendingUp, TrendingDown } from 'lucide-react';

const mockMostBought = [
    {
        id: 1,
        name: "Newgen Software Tech",
        price: "₹528.80",
        change: "65.75 (14.20%)",
        isPositive: true,
        logo: "N" // Placeholder
    },
    {
        id: 2,
        name: "TATA SILVER",
        price: "₹22.55",
        change: "-0.49 (2.13%)",
        isPositive: false,
        logo: "T"
    },
    {
        id: 3,
        name: "TATA GOLD",
        price: "₹14.64",
        change: "-0.23 (1.55%)",
        isPositive: false,
        logo: "T"
    },
    {
        id: 4,
        name: "Hindustan Copper",
        price: "₹552.70",
        change: "-21.70 (3.78%)",
        isPositive: false,
        logo: "H"
    }
];

const MostBoughtStocks = () => {
    return (
        <div className="investor-card p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Most Searched Stocks on Radar</h3>
                <button className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded">View all</button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                {mockMostBought.map((stock) => (
                    <div key={stock.id} className="p-4 relative group hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 border border-slate-100 rounded-2xl bg-white">
                        <div className="absolute top-3 right-3 text-slate-200 group-hover:text-emerald-500 cursor-pointer transition-colors">
                            <Bookmark size={15} />
                        </div>

                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-emerald-600/60 mb-4 shadow-sm group-hover:bg-emerald-50 transition-colors">
                            {stock.logo}
                        </div>

                        <h4 className="text-xs font-bold text-slate-700 mb-5 line-clamp-2 h-8 leading-tight group-hover:text-emerald-700 transition-colors">{stock.name}</h4>

                        <div className="mt-auto border-t border-slate-50 pt-3">
                            <div className="text-sm font-black text-slate-800">{stock.price}</div>
                            <div className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${stock.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stock.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {stock.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MostBoughtStocks;
