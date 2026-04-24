import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Maximize2,
  Minimize2,
  Plus,
  X,
  Save,
  FolderOpen,
  Settings,
  Copy,
  Layout,
  Monitor,
} from 'lucide-react';
import AdvancedTradingChart from './AdvancedTradingChart';



const LAYOUTS = [
  { id: '1x1', label: '1 Chart', rows: 1, cols: 1, icon: 'â¬œ' },
  { id: '1x2', label: '1Ã—2', rows: 1, cols: 2, icon: 'â–¯' },
  { id: '2x1', label: '2Ã—1', rows: 2, cols: 1, icon: 'â–­' },
  { id: '2x2', label: '2Ã—2', rows: 2, cols: 2, icon: 'âŠž' },
  { id: '1x3', label: '1Ã—3', rows: 1, cols: 3, icon: 'â˜°' },
  { id: '3x1', label: '3Ã—1', rows: 3, cols: 1, icon: 'â‹®' },
  { id: '2x3', label: '2Ã—3', rows: 2, cols: 3, icon: 'âŠ¡' },
  { id: '3x2', label: '3Ã—2', rows: 3, cols: 2, icon: 'âŠŸ' },
  { id: '3x3', label: '3Ã—3', rows: 3, cols: 3, icon: 'âŠž' },
];

const DEFAULT_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK'];

const MultiChartWorkspace = () => {
  const [layout, setLayout] = useState('2x2');
  const [charts, setCharts] = useState([
    { id: 1, symbol: 'RELIANCE', timeframe: '15' },
    { id: 2, symbol: 'TCS', timeframe: '15' },
    { id: 3, symbol: 'INFY', timeframe: '15' },
    { id: 4, symbol: 'HDFCBANK', timeframe: '15' },
  ]);
  const [fullscreenChart, setFullscreenChart] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [savedWorkspaces, setSavedWorkspaces] = useState([]);

  const currentLayout = LAYOUTS.find(l => l.id === layout);
  const totalCharts = currentLayout.rows * currentLayout.cols;

  const displayCharts = [...charts];
  while (displayCharts.length < totalCharts) {
    const nextSymbol = DEFAULT_SYMBOLS[displayCharts.length % DEFAULT_SYMBOLS.length];
    displayCharts.push({
      id: Date.now() + displayCharts.length,
      symbol: nextSymbol,
      timeframe: '15',
    });
  }

  const updateChart = useCallback((chartId, updates) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
  }, []);

  const removeChart = useCallback((chartId) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  }, []);

  const addChart = useCallback(() => {
    const newChart = {
      id: Date.now(),
      symbol: DEFAULT_SYMBOLS[charts.length % DEFAULT_SYMBOLS.length],
      timeframe: '15',
    };
    setCharts(prev => [...prev, newChart]);
  }, [charts.length]);

  const changeLayout = useCallback((newLayout) => {
    setLayout(newLayout);
    setShowLayoutMenu(false);
  }, []);

  const toggleFullscreen = useCallback((chartId) => {
    setFullscreenChart(fullscreenChart === chartId ? null : chartId);
  }, [fullscreenChart]);

  const saveWorkspace = useCallback(() => {
    if (!workspaceName.trim()) return;

    const workspace = {
      id: Date.now(),
      name: workspaceName,
      layout,
      charts: displayCharts.slice(0, totalCharts),
      syncEnabled,
      createdAt: new Date().toISOString(),
    };

    const saved = JSON.parse(localStorage.getItem('radar-workspaces') || '[]');
    saved.push(workspace);
    localStorage.setItem('radar-workspaces', JSON.stringify(saved));
    
    setSavedWorkspaces(saved);
    setWorkspaceName('');
    setShowSaveMenu(false);
  }, [workspaceName, layout, displayCharts, totalCharts, syncEnabled]);

  const loadWorkspace = useCallback((workspace) => {
    setLayout(workspace.layout);
    setCharts(workspace.charts);
    setSyncEnabled(workspace.syncEnabled);
    setShowSaveMenu(false);
  }, []);

  const deleteWorkspace = useCallback((workspaceId) => {
    const saved = JSON.parse(localStorage.getItem('radar-workspaces') || '[]');
    const filtered = saved.filter(w => w.id !== workspaceId);
    localStorage.setItem('radar-workspaces', JSON.stringify(filtered));
    setSavedWorkspaces(filtered);
  }, []);

  React.useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('radar-workspaces') || '[]');
    setSavedWorkspaces(saved);
  }, []);

  return (
    <div className="h-full bg-slate-950 flex flex-col">
      {}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Monitor className="w-6 h-6 text-cyan-400" />
            Multi-Chart Workspace
          </h1>
          {syncEnabled && (
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-400/30">
              ðŸ”— Sync Enabled
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {}
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <Layout className="w-4 h-4" />
              <span className="text-sm font-semibold">{currentLayout.label}</span>
              <span className="text-lg">{currentLayout.icon}</span>
            </button>

            <AnimatePresence>
              {showLayoutMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 right-0 w-64 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
                      Select Layout
                    </div>
                    {LAYOUTS.map(l => (
                      <button
                        key={l.id}
                        onClick={() => changeLayout(l.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors ${
                          layout === l.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'
                        }`}
                      >
                        <span className="text-sm font-semibold">{l.label}</span>
                        <span className="text-xl">{l.icon}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {}
          <button
            onClick={() => setSyncEnabled(!syncEnabled)}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              syncEnabled
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span className="text-sm font-semibold">Sync</span>
          </button>

          {}
          <div className="relative">
            <button
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm font-semibold">Workspace</span>
            </button>

            <AnimatePresence>
              {showSaveMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 right-0 w-80 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50"
                >
                  {}
                  <div className="p-4 border-b border-slate-700">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Save Current Workspace
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="Workspace name..."
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button
                        onClick={saveWorkspace}
                        disabled={!workspaceName.trim()}
                        className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {}
                  <div className="p-2 max-h-80 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
                      Saved Workspaces ({savedWorkspaces.length})
                    </div>
                    {savedWorkspaces.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No saved workspaces yet
                      </div>
                    ) : (
                      savedWorkspaces.map(workspace => (
                        <div
                          key={workspace.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700 group"
                        >
                          <button
                            onClick={() => loadWorkspace(workspace)}
                            className="flex-1 text-left"
                          >
                            <div className="text-sm font-semibold text-white group-hover:text-cyan-300">
                              {workspace.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {workspace.layout} â€¢ {workspace.charts.length} charts
                            </div>
                          </button>
                          <button
                            onClick={() => deleteWorkspace(workspace.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 p-4 overflow-auto">
        {fullscreenChart ? (
          <div className="h-full">
            <div className="h-full bg-slate-900 rounded-2xl overflow-hidden relative">
              <button
                onClick={() => setFullscreenChart(null)}
                className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-sm"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <AdvancedTradingChart
                symbol={displayCharts.find(c => c.id === fullscreenChart)?.symbol}
                initialTimeframe={displayCharts.find(c => c.id === fullscreenChart)?.timeframe}
                height={window.innerHeight - 150}
              />
            </div>
          </div>
        ) : (
          <div 
            className="grid gap-4 h-full"
            style={{
              gridTemplateRows: `repeat(${currentLayout.rows}, 1fr)`,
              gridTemplateColumns: `repeat(${currentLayout.cols}, 1fr)`,
            }}
          >
            {displayCharts.slice(0, totalCharts).map((chart, index) => (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group"
              >
                {}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleFullscreen(chart.id)}
                    className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white backdrop-blur-sm transition-all"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {totalCharts > 1 && (
                    <button
                      onClick={() => removeChart(chart.id)}
                      className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-rose-500 hover:text-white backdrop-blur-sm transition-all"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {}
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    value={chart.symbol}
                    onChange={(e) => updateChart(chart.id, { symbol: e.target.value })}
                    className="px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {DEFAULT_SYMBOLS.map(symbol => (
                      <option key={symbol} value={symbol}>{symbol}</option>
                    ))}
                  </select>
                </div>

                <AdvancedTradingChart
                  symbol={chart.symbol}
                  initialTimeframe={chart.timeframe}
                  height={300}
                  showHeader={false}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiChartWorkspace;
