import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const assets = {
  stocks: [
    { symbol: 'NVDA', name: 'Nvidia', price: '531.40', change: '+3.4%', trend: 'up', type: 'High Momentum' },
    { symbol: 'AAPL', name: 'Apple', price: '185.92', change: '+0.5%', trend: 'up', type: 'Stable' },
    { symbol: 'TSLA', name: 'Tesla', price: '235.40', change: '-2.1%', trend: 'down', type: 'Volatile' },
  ],
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: '$42,505', change: '+2.5%', trend: 'up', type: 'Trending' },
    { symbol: 'ETH', name: 'Ethereum', price: '$2,250', change: '+1.3%', trend: 'up', type: 'Trending' },
    { symbol: 'SOL', name: 'Solana', price: '$98.30', change: '-1.5%', trend: 'down', type: 'High Risk' },
  ],
  forex: [
    { symbol: 'EUR/USD', name: 'Euro', price: '1.0950', change: '-0.05%', trend: 'down', type: 'Stable' },
    { symbol: 'GBP/USD', name: 'Pound', price: '1.2730', change: '+0.10%', trend: 'up', type: 'Stable' },
    { symbol: 'USD/JPY', name: 'Yen', price: '145.20', change: '+0.40%', trend: 'up', type: 'Trending' },
  ],
};

const FilterTag = ({ label, active }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${active
      ? 'bg-[#42C0A5]/20 border-[#42C0A5] text-[#6FFFE9]'
      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
    }`}
  >
    {label}
  </span>
);

export default function AssetExplorer({ className }) {
  const [activeTab, setActiveTab] = useState('stocks');

  return (
    <div className={className ?? 'w-full bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans'] mb-2">Asset Explorer</h3>
          <div className="flex gap-2">
            {['stocks', 'crypto', 'forex'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                  ? 'bg-[#42C0A5] text-[#103E46]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <FilterTag label="Trending" active />
          <FilterTag label="Low Risk" active={false} />
          <FilterTag label="High Momentum" active={false} />
        </div>
      </div>

      <div className="grid gap-4">
        {assets[activeTab].map((asset, i) => (
          <motion.div
            key={asset.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${asset.trend === 'up'
                  ? 'bg-[#42C0A5]/10 text-[#42C0A5]'
                  : 'bg-red-400/10 text-red-400'
                }`}
              >
                {asset.trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
              <div>
                <div className="font-bold text-white text-lg">{asset.symbol}</div>
                <div className="text-white/40 text-sm">{asset.name}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="font-mono text-white font-medium">{asset.price}</div>
              <div
                className={`text-xs font-bold px-2 py-0.5 rounded ${asset.trend === 'up'
                  ? 'text-[#42C0A5] bg-[#42C0A5]/10'
                  : 'text-red-400 bg-red-400/10'
                }`}
              >
                {asset.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
