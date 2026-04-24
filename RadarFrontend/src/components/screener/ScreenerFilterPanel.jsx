import React, { useState } from 'react';
import { ChevronDown, X, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

const ScreenerFilterPanel = ({ sectors, filters, onFilterChange, onActivateScan, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    technical: true,
    advanced: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleMultiSelect = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  const handleReset = () => {
    onFilterChange({
      search: '',
      sector: 'All',
      signals: [],
      minPriceChange: 0,
      maxPriceChange: null,
      minRsi: 0,
      maxRsi: 100,
      minPrice: '',
      maxPrice: '',
      minVolume: '',
      showOnlySignals: true,
      trendType: 'all',
    });
  };

  return (
    <div className="h-full flex flex-col py-4 screener-filter-panel">
      {}
      <div className="px-4 pb-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Scanner Filters</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {}
      <div className="flex-1 overflow-y-auto">
        {}
        <div className="px-4 py-4 border-b border-slate-700/50">
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Search</label>
          <input
            type="text"
            placeholder="Symbol or Name..."
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {}
        <motion.div className="border-b border-slate-700/50">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-300">Basic Filters</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                expandedSections.basic ? 'rotate-180' : ''
              }`}
            />
          </button>

          <motion.div
            initial={false}
            animate={{ height: expandedSections.basic ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
            overflow="hidden"
            className="px-4 pb-4 space-y-4"
          >
            {}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Asset Sectors
              </label>
              <select
                value={filters.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Market Structure</label>
              <select
                value={filters.trendType}
                onChange={(e) => handleInputChange('trendType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="all">All Trends</option>
                <option value="bullish">Bullish</option>
                <option value="neutral">Neutral</option>
                <option value="bearish">Bearish</option>
              </select>
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Price Change %
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPriceChange}
                  onChange={(e) =>
                    handleInputChange('minPriceChange', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {}
        <motion.div className="border-b border-slate-700/50">
          <button
            onClick={() => toggleSection('technical')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-300">Technical</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                expandedSections.technical ? 'rotate-180' : ''
              }`}
            />
          </button>

          <motion.div
            initial={false}
            animate={{ height: expandedSections.technical ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
            overflow="hidden"
            className="px-4 pb-4 space-y-4"
          >
            {}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Momentum Range (RSI): {filters.minRsi} - {filters.maxRsi}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minRsi}
                  onChange={(e) => handleInputChange('minRsi', parseInt(e.target.value))}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.maxRsi}
                  onChange={(e) => handleInputChange('maxRsi', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Research Signals</label>
              <div className="space-y-2">
                {['BREAKOUT', 'MOMENTUM', 'PULLBACK'].map((signal) => (
                  <label key={signal} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.signals.includes(signal)}
                      onChange={() => handleMultiSelect('signals', signal)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                    />
                    <span className="text-sm text-slate-300">{signal}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {}
        <motion.div className="border-b border-slate-700/50">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-300">Advanced</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                expandedSections.advanced ? 'rotate-180' : ''
              }`}
            />
          </button>

          <motion.div
            initial={false}
            animate={{ height: expandedSections.advanced ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
            overflow="hidden"
            className="px-4 pb-4 space-y-4"
          >
            {}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Price Range</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleInputChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Min Volume</label>
              <input
                type="number"
                placeholder="e.g., 1000000"
                value={filters.minVolume}
                onChange={(e) => handleInputChange('minVolume', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {}
      <div className="px-4 pt-4 border-t border-slate-700 space-y-2">
        <button
          onClick={() => onActivateScan?.()}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-semibold uppercase tracking-wide"
        >
          Activate Scan
        </button>
        <button
          onClick={handleReset}
          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium"
        >
          Clear Params
        </button>
      </div>
    </div>
  );
};

export default ScreenerFilterPanel;
