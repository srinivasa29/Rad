import React, { useState } from 'react';
import { ChevronDown, X, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

const ScreenerFilterPanel = ({
  sectors,
  filters,
  onFilterChange,
  onActivateScan,
  onClose,
  defaultFilters,
  onReset,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    technical: true,
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
    if (onReset) {
      onReset();
      return;
    }
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
      ...(defaultFilters || {}),
    });
  };

  return (
    <div className="h-full flex flex-col py-4 screener-filter-panel">
      {/* Header */}
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

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Global Search */}
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

        {/* Basic Filters */}
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
            style={{ overflow: 'hidden' }}
            className="px-4 pb-4 space-y-4"
          >
            {/* Sector */}
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

            {/* Signal Bias Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Signal Bias</label>
              <select
                value={filters.trendType}
                onChange={(e) => handleInputChange('trendType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="all">All Signals</option>
                <option value="bullish">Bullish</option>
                <option value="neutral">Neutral</option>
                <option value="bearish">Bearish</option>
              </select>
            </div>

            {/* Price Change */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Price Change %
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPriceChange}
                  onChange={(e) =>
                    handleInputChange('minPriceChange', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPriceChange ?? ''}
                  onChange={(e) =>
                    handleInputChange('maxPriceChange', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Price Range */}
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

            {/* Min Volume */}
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

        {/* Technical Filters */}
        <motion.div className="border-b border-slate-700/50">
          <button
            onClick={() => toggleSection('technical')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-300">Technical Indicators</span>
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
            style={{ overflow: 'hidden' }}
            className="px-4 pb-4 space-y-4"
          >
            {/* Momentum Range */}
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

            {/* Signal Bias Multi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Signal Bias (Multi)</label>
              <div className="space-y-2">
                {['BULLISH', 'NEUTRAL', 'BEARISH'].map((signal) => (
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

            <div className="pt-1 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showOnlySignals}
                  onChange={(e) => handleInputChange('showOnlySignals', e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                />
                <span className="text-sm text-slate-300">Sync with active signal tab</span>
              </label>
            </div>

            {/* Breakouts */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Breakout Type</label>
              <select
                value={filters.breakoutType || 'all'}
                onChange={(e) => handleInputChange('breakoutType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Breakouts</option>
                <option value="resistance_breakout">Resistance Breakout</option>
                <option value="52_week_high">52-Week Breakout</option>
              </select>
            </div>

            {/* EMA Crossovers */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">EMA Crossover (20/50)</label>
              <select
                value={filters.emaCrossover || 'all'}
                onChange={(e) => handleInputChange('emaCrossover', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Trends</option>
                <option value="bullish">{"Bullish (EMA20 > EMA50)"}</option>
                <option value="bearish">{"Bearish (EMA20 < EMA50)"}</option>
              </select>
            </div>

            {/* SMA Crossovers */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">SMA Golden/Death Cross</label>
              <select
                value={filters.smaCrossover || 'all'}
                onChange={(e) => handleInputChange('smaCrossover', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Crossovers</option>
                <option value="bullish_golden_cross">{"Golden Cross (SMA50 > SMA200)"}</option>
                <option value="bearish_death_cross">{"Death Cross (SMA50 < SMA200)"}</option>
              </select>
            </div>

            {/* Bollinger Squeeze */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Bollinger Squeeze</label>
              <select
                value={filters.bollingerSqueeze || ''}
                onChange={(e) => handleInputChange('bollingerSqueeze', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">Any Volatility</option>
                <option value="true">Squeezed (Low Volatility)</option>
                <option value="false">Normal (High Volatility)</option>
              </select>
            </div>

            {/* Candlestick Pattern */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Candlestick Pattern</label>
              <select
                value={filters.candlestickPattern || 'all'}
                onChange={(e) => handleInputChange('candlestickPattern', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Patterns</option>
                <option value="hammer">Hammer (Bullish reversal)</option>
                <option value="bullish_engulfing">Bullish Engulfing</option>
                <option value="bearish_engulfing">Bearish Engulfing</option>
                <option value="doji">Doji (Indecision)</option>
              </select>
            </div>

            {/* Trend Strength */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Trend Strength</label>
              <select
                value={filters.trendStrength || 'all'}
                onChange={(e) => handleInputChange('trendStrength', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Strengths</option>
                <option value="strong">Strong (High Momentum)</option>
                <option value="moderate">Moderate</option>
                <option value="weak">Weak / Pullback</option>
              </select>
            </div>

            {/* Risk / Reward Score */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Min Risk/Reward Ratio</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 2.0"
                value={filters.minRiskReward || ''}
                onChange={(e) => handleInputChange('minRiskReward', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Buttons */}
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
