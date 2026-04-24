import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSection, setExpandedSection] = useState('price');

  const handlePriceRangeChange = (index, value) => {
    const newRange = [...localFilters.priceRange];
    newRange[index] = parseFloat(value) || 0;
    setLocalFilters({ ...localFilters, priceRange: newRange });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      priceRange: [0, 5000],
      volumeMin: 0,
      rsiMin: 0,
      rsiMax: 100,
    };
    setLocalFilters(defaultFilters);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl overflow-hidden">
              {}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/30 bg-slate-900/50">
                <h2 className="text-xl font-bold text-slate-100">Advanced Filters</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>

              {}
              <div className="overflow-y-auto max-h-[calc(100vh-250px)] p-4 space-y-3">
                {}
                <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'price' ? null : 'price')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-semibold text-slate-200">Price Range</span>
                    <motion.div
                      animate={{ rotate: expandedSection === 'price' ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'price' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-slate-700/30 bg-slate-950/50 space-y-3"
                      >
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-2">
                            Min Price: â‚¹{localFilters.priceRange[0]}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="5000"
                            value={localFilters.priceRange[0]}
                            onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-2">
                            Max Price: â‚¹{localFilters.priceRange[1]}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="5000"
                            value={localFilters.priceRange[1]}
                            onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="flex gap-2 text-xs text-slate-400">
                          <span>â‚¹{localFilters.priceRange[0]}</span>
                          <span>-</span>
                          <span>â‚¹{localFilters.priceRange[1]}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {}
                <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'volume' ? null : 'volume')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-semibold text-slate-200">Minimum Volume</span>
                    <motion.div
                      animate={{ rotate: expandedSection === 'volume' ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'volume' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-slate-700/30 bg-slate-950/50 space-y-3"
                      >
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-2">
                            Min Volume: {localFilters.volumeMin.toLocaleString()}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="10000000"
                            step="100000"
                            value={localFilters.volumeMin}
                            onChange={(e) =>
                              setLocalFilters({
                                ...localFilters,
                                volumeMin: parseInt(e.target.value),
                              })
                            }
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {[1000000, 5000000, 10000000].map((val) => (
                            <button
                              key={val}
                              onClick={() =>
                                setLocalFilters({ ...localFilters, volumeMin: val })
                              }
                              className={`px-3 py-1.5 rounded-lg border transition-all ${
                                localFilters.volumeMin === val
                                  ? 'bg-purple-500/30 border-purple-500/50 text-purple-300'
                                  : 'border-slate-700/30 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              {val / 1000000}M
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {}
                <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'rsi' ? null : 'rsi')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-semibold text-slate-200">RSI Range</span>
                    <motion.div
                      animate={{ rotate: expandedSection === 'rsi' ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'rsi' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-slate-700/30 bg-slate-950/50 space-y-3"
                      >
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-2">
                            Min RSI: {localFilters.rsiMin}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={localFilters.rsiMin}
                            onChange={(e) =>
                              setLocalFilters({
                                ...localFilters,
                                rsiMin: parseInt(e.target.value),
                              })
                            }
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-2">
                            Max RSI: {localFilters.rsiMax}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={localFilters.rsiMax}
                            onChange={(e) =>
                              setLocalFilters({
                                ...localFilters,
                                rsiMax: parseInt(e.target.value),
                              })
                            }
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                          <button
                            onClick={() =>
                              setLocalFilters({ ...localFilters, rsiMin: 0, rsiMax: 30 })
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-700/30 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300 transition-all"
                          >
                            Oversold
                          </button>
                          <button
                            onClick={() =>
                              setLocalFilters({ ...localFilters, rsiMin: 70, rsiMax: 100 })
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-700/30 text-slate-400 hover:border-rose-500/50 hover:text-rose-300 transition-all"
                          >
                            Overbought
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {}
              <div className="flex gap-2 p-4 border-t border-slate-700/30 bg-slate-900/50">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-semibold hover:bg-slate-700/30 transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
