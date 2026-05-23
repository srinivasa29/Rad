import re
import os

file_path = r"c:\Users\manne\OneDrive\Desktop\capstone\New folder\Final-year-Project\RadarFrontend\src\pages\TraderStockPage.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to avoid issues
content_norm = content.replace("\r\n", "\n")

# Locate the start and end of the block
start_marker = "        {/* ── Left Column (70%): Chart & Bottom Tabs ── */}"
end_marker = "      {/* ── Set Price Alert Modal ── */}"

start_idx = content_norm.find(start_marker)
end_idx = content_norm.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"Error: Markers not found. start_idx={start_idx}, end_idx={end_idx}")
    exit(1)

replacement_text = """        {/* ── Left Column (70%): Chart & Bottom Tabs ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#04080e] overflow-y-auto custom-scrollbar border-r border-white/[0.04]">
          
          {/* Professional Chart Container */}
          <div className="flex-shrink-0 border-b border-white/[0.04] bg-[#070b13] p-4">
            <div className="relative rounded-2xl border border-white/[0.04] bg-black/40 overflow-hidden">
              <div className="absolute top-4 right-14 z-20 flex items-center gap-2 bg-[#090d16]/80 px-3 py-1 rounded-full border border-white/5 pointer-events-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Feed</span>
              </div>
              <TradingViewChart symbol={stock.symbol} />
            </div>
          </div>

          {/* Collapsible Details Section Container */}
          <div className="flex-grow">

            {/* ── Collapsible Research Panels below Chart ── */}
            <div className="space-y-6">
                
                {/* ── OVERVIEW TAB ── */}
                {tab === 'Overview' && (
                  <div className="space-y-6">
                    
                    {/* ── SECTION 1: TECHNICAL INDICATORS ── */}
                    <div className="rounded-2xl border border-white/[0.04] bg-[#070b13] overflow-hidden shadow-2xl transition-all hover:border-cyan-500/10">
                      <button 
                        onClick={() => toggleSection('techSignals')}
                        className="w-full flex items-center justify-between px-6 py-4 bg-black/20 hover:bg-black/30 transition-all font-sans cursor-pointer text-slate-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Zap size={16} />
                          <span className="text-xs font-black uppercase tracking-widest text-[11px]">Section 1 — Technical Indicators & Consensus</span>
                        </div>
                        {expandedSections.techSignals ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedSections.techSignals && (
                        <div className="p-6 border-t border-white/[0.04] space-y-6">
                          {!techData?.indicators ? (
                            <div className="p-6 text-center text-xs font-bold text-slate-500 bg-black/20 rounded-xl border border-white/5 animate-pulse">
                              Live technical indicators loading...
                            </div>
                          ) : (
                            <>
                              {/* Signal Consensus Header */}
                              <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 gap-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Technical Consensus</span>
                                  <span className={`text-xs font-black px-2.5 py-0.5 rounded border ${gaugeColor === 'text-emerald-400' ? 'border-emerald-500/20 bg-emerald-500/5' : gaugeColor === 'text-rose-400' ? 'border-rose-500/20 bg-rose-500/5' : 'border-slate-500/20 bg-slate-500/5'} ${gaugeColor}`}>
                                    {gaugeValue}
                                  </span>
                                </div>
                                <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                                  <span className="text-rose-400 font-mono">Sell {sellCount}</span>
                                  <span className="text-slate-400 font-mono">Neutral {neutralCount}</span>
                                  <span className="text-emerald-400 font-mono">Buy {buyCount}</span>
                                </div>
                              </div>

                              {/* Technical Indicators Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {indicatorsList.map((ind, i) => (
                                  <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-between hover:border-cyan-500/20 transition-all">
                                    <div>
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">{ind.name}</span>
                                      <span className="text-xs font-bold text-slate-200 block font-mono">{ind.value}</span>
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase mt-2 ${
                                      ind.status === 'bull' ? 'text-emerald-400' : ind.status === 'bear' ? 'text-rose-400' : 'text-slate-500'
                                    }`}>
                                      {ind.action}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 2: FUNDAMENTAL METRICS ── */}
                    <div className="rounded-2xl border border-white/[0.04] bg-[#070b13] overflow-hidden shadow-2xl transition-all hover:border-cyan-500/10">
                      <button 
                        onClick={() => toggleSection('fundamentals')}
                        className="w-full flex items-center justify-between px-6 py-4 bg-black/20 hover:bg-black/30 transition-all font-sans cursor-pointer text-slate-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Info size={16} />
                          <span className="text-xs font-black uppercase tracking-widest text-[11px]">Section 2 — Fundamental Metrics</span>
                        </div>
                        {expandedSections.fundamentals ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedSections.fundamentals && (
                        <div className="p-6 border-t border-white/[0.04] space-y-6">
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Market Cap</span>
                              <span className="text-xs font-extrabold text-white font-mono">
                                {stockDetails?.marketCap ? (stockDetails.marketCap > 1e11 ? `₹${(stockDetails.marketCap / 1e12).toFixed(2)}T` : `₹${(stockDetails.marketCap / 1e7).toFixed(2)}Cr`) : '—'}
                              </span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">P/E Ratio</span>
                              <span className="text-xs font-extrabold text-white font-mono">{stockDetails?.peRatio ? Number(stockDetails.peRatio).toFixed(2) : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">EPS</span>
                              <span className="text-xs font-extrabold text-white font-mono">{stockDetails?.eps ? `₹${Number(stockDetails.eps).toFixed(2)}` : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Dividend Yield</span>
                              <span className="text-xs font-extrabold text-white font-mono">{stockDetails?.dividendYield || stockDetails?.divYield ? `${Number(stockDetails?.dividendYield || stockDetails?.divYield).toFixed(2)}%` : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">52W High</span>
                              <span className="text-xs font-extrabold text-emerald-400 font-mono">{stockDetails?.w52High ? formatPrice(stockDetails.w52High, assetType, stock.symbol) : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">52W Low</span>
                              <span className="text-xs font-extrabold text-rose-400 font-mono">{stockDetails?.w52Low ? formatPrice(stockDetails.w52Low, assetType, stock.symbol) : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Sector</span>
                              <span className="text-xs font-bold text-slate-300 block truncate">{fundamentals?.sector || '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Industry</span>
                              <span className="text-xs font-bold text-slate-300 block truncate">{fundamentals?.industry || '—'}</span>
                            </div>
                          </div>

                          {/* Full Fundamentals Panel Wrapper */}
                          <div className="border-t border-white/5 pt-4">
                            <StockFundamentalsPanel symbol={stock.symbol} compact={false} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 3: SUPPORT/RESISTANCE & PIVOT LEVELS ── */}
                    <div className="rounded-2xl border border-white/[0.04] bg-[#070b13] overflow-hidden shadow-2xl transition-all hover:border-cyan-500/10">
                      <button 
                        onClick={() => toggleSection('keyLevels')}
                        className="w-full flex items-center justify-between px-6 py-4 bg-black/20 hover:bg-black/30 transition-all font-sans cursor-pointer text-slate-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Grid size={16} />
                          <span className="text-xs font-black uppercase tracking-widest text-[11px]">Section 3 — Support/Resistance & Pivot Levels</span>
                        </div>
                        {expandedSections.keyLevels ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedSections.keyLevels && (
                        <div className="p-6 border-t border-white/[0.04] space-y-6">
                          {/* Day range & 52w range */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Day Low</span>
                              <span className="text-xs font-extrabold text-white font-mono">{stockDetails?.low ? formatPrice(stockDetails.low, assetType, stock.symbol) : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Day High</span>
                              <span className="text-xs font-extrabold text-white font-mono">{stockDetails?.high ? formatPrice(stockDetails.high, assetType, stock.symbol) : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">52W Low</span>
                              <span className="text-xs font-extrabold text-white font-mono">{stockDetails?.w52Low ? formatPrice(stockDetails.w52Low, assetType, stock.symbol) : '—'}</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">52W High</span>
                              <span className="text-xs font-extrabold text-white font-mono">{stockDetails?.w52High ? formatPrice(stockDetails.w52High, assetType, stock.symbol) : '—'}</span>
                            </div>
                          </div>

                          {/* Pivots table grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-3">
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">Resistance Levels</span>
                              <div className="space-y-2 text-xs font-mono">
                                <div className="flex justify-between py-1 border-b border-white/5">
                                  <span className="text-slate-500">R3</span>
                                  <span className="text-slate-200 font-bold">{formatPrice(pivots.r3, assetType, stock.symbol)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-white/5">
                                  <span className="text-slate-500">R2</span>
                                  <span className="text-slate-200 font-bold">{formatPrice(pivots.r2, assetType, stock.symbol)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-slate-500">R1</span>
                                  <span className="text-slate-200 font-bold">{formatPrice(pivots.r1, assetType, stock.symbol)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-cyan-950/20 p-5 rounded-xl border border-cyan-500/20 flex flex-col justify-center items-center text-center">
                              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2">Pivot Point (PP)</span>
                              <span className="text-2xl font-black text-white font-mono">{formatPrice(pivots.pivot, assetType, stock.symbol)}</span>
                              <span className="text-[9px] text-slate-500 mt-2">Calculated daily average price benchmark</span>
                            </div>

                            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-3">
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Support Levels</span>
                              <div className="space-y-2 text-xs font-mono">
                                <div className="flex justify-between py-1 border-b border-white/5">
                                  <span className="text-slate-500">S1</span>
                                  <span className="text-slate-200 font-bold">{formatPrice(pivots.s1, assetType, stock.symbol)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-white/5">
                                  <span className="text-slate-500">S2</span>
                                  <span className="text-slate-200 font-bold">{formatPrice(pivots.s2, assetType, stock.symbol)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-slate-500">S3</span>
                                  <span className="text-slate-200 font-bold">{formatPrice(pivots.s3, assetType, stock.symbol)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 4: LIVE NEWS & SENTIMENT ── */}
                    <div className="rounded-2xl border border-white/[0.04] bg-[#070b13] overflow-hidden shadow-2xl transition-all hover:border-cyan-500/10">
                      <button 
                        onClick={() => toggleSection('news')}
                        className="w-full flex items-center justify-between px-6 py-4 bg-black/20 hover:bg-black/30 transition-all font-sans cursor-pointer text-slate-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Newspaper size={16} />
                          <span className="text-xs font-black uppercase tracking-widest text-[11px]">Section 4 — Live News & Sentiment</span>
                        </div>
                        {expandedSections.news ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedSections.news && (
                        <div className="p-6 border-t border-white/[0.04]">
                          {news?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                              {news.slice(0, 6).map((item, i) => (
                                <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-between hover:border-[#22d3ee]/20 transition-all duration-300">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[9px] font-semibold">
                                      <span className="text-slate-500 uppercase">{item.source || 'Market Feed'}</span>
                                      <span className="text-slate-500 font-mono">{item.time || 'Today'}</span>
                                    </div>
                                    <h3 className="text-xs font-bold text-white leading-snug line-clamp-3 hover:text-cyan-400 cursor-pointer">
                                      <a href={item.url || '#'} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                    </h3>
                                  </div>
                                  {item.sentiment && (
                                    <div className="mt-4 flex items-center">
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                        item.sentiment.toLowerCase() === 'bullish' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                        item.sentiment.toLowerCase() === 'bearish' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                                        'text-slate-400 bg-slate-500/10 border-slate-500/20'
                                      }`}>
                                        {item.sentiment} Sentiment
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-xs font-bold text-slate-500 bg-black/20 rounded-xl border border-white/5">
                              Live news feed unavailable
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── SECTION 5: FINANCIAL PERFORMANCE ── */}
                    <div className="rounded-2xl border border-white/[0.04] bg-[#070b13] overflow-hidden shadow-2xl transition-all hover:border-cyan-500/10">
                      <button 
                        onClick={() => toggleSection('financials')}
                        className="w-full flex items-center justify-between px-6 py-4 bg-black/20 hover:bg-black/30 transition-all font-sans cursor-pointer text-slate-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2 text-cyan-400">
                          <BarChart3 size={16} />
                          <span className="text-xs font-black uppercase tracking-widest text-[11px]">Section 5 — Financial Performance</span>
                        </div>
                        {expandedSections.financials ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedSections.financials && (
                        <div className="p-6 border-t border-white/[0.04] space-y-6">
                          {fundamentals?.ratios ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Return on Equity (ROE)</span>
                                <span className="text-xs font-extrabold text-white font-mono">{fundamentals.ratios.roe ? `${(fundamentals.ratios.roe * 100).toFixed(2)}%` : 'Live data unavailable'}</span>
                              </div>
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Profit Margin (Net)</span>
                                <span className="text-xs font-extrabold text-white font-mono">{fundamentals.ratios.netProfitMargin ? `${(fundamentals.ratios.netProfitMargin * 100).toFixed(2)}%` : 'Live data unavailable'}</span>
                              </div>
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Debt to Equity</span>
                                <span className="text-xs font-extrabold text-white font-mono">{fundamentals.ratios.debtToEquity != null ? Number(fundamentals.ratios.debtToEquity).toFixed(2) : 'Live data unavailable'}</span>
                              </div>
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Current Ratio</span>
                                <span className="text-xs font-extrabold text-white font-mono">{fundamentals.ratios.currentRatio != null ? Number(fundamentals.ratios.currentRatio).toFixed(2) : 'Live data unavailable'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-xs font-bold text-slate-500 bg-black/20 rounded-xl border border-white/5">
                              Live data unavailable
                            </div>
                          )}

                          {/* Financial Statement Tables */}
                          {fundamentals?.financials?.incomeStatement?.length > 0 ? (
                            <div className="space-y-3">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Historical Income Statement (Annual Trend)</span>
                              <div className="overflow-x-auto rounded-xl border border-white/5">
                                <table className="w-full text-left border-collapse text-xs font-sans">
                                  <thead>
                                    <tr className="bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                      <th className="p-3">Financial Year</th>
                                      <th className="p-3 text-right">Revenue</th>
                                      <th className="p-3 text-right">Net Income</th>
                                      <th className="p-3 text-right">EPS</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 font-mono">
                                    {fundamentals.financials.incomeStatement.slice(0, 4).map((row, i) => (
                                      <tr key={i} className="hover:bg-white/[0.02]">
                                        <td className="p-3 text-slate-300 font-bold">{row.date || row.calendarYear || 'FY'}</td>
                                        <td className="p-3 text-slate-200 text-right">₹{(row.revenue / 1e7).toFixed(2)}Cr</td>
                                        <td className="p-3 text-right text-emerald-400 font-bold font-mono">₹{(row.netIncome / 1e7).toFixed(2)}Cr</td>
                                        <td className="p-3 text-slate-300 text-right font-mono">₹{Number(row.eps).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-xs font-bold text-slate-500 bg-black/20 rounded-xl border border-white/5">
                              Live financial details unavailable
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}

            </div>
          </div>
        </div>

        {/* ── Right Column (30%): Action widgets & Signals (Desktop) ── */}
        <div className="hidden xl:flex flex-shrink-0 flex-col overflow-y-auto border-l border-white/[0.04] bg-[#070b13] p-5 space-y-5" style={{ width: 340 }}>
          
          {/* Signal Strength Card */}
          <SignalStrengthCard 
            buyCount={buyCount} 
            sellCount={sellCount} 
            neutralCount={neutralCount} 
            totalCount={totalCount} 
            gaugeValue={gaugeValue} 
            gaugeColor={gaugeColor} 
            techData={techData}
          />

          {/* Breakout checklist */}
          <BreakoutChecklistCard 
            stock={stock} 
            techData={techData}
          />

          {/* Key Levels Card */}
          <KeyLevelsCard 
            pivots={pivots} 
            stock={stock} 
            stockDetails={stockDetails} 
            assetType={assetType}
          />

          {/* Market Status Card */}
          <MarketStatusCard 
            marketStatus={marketStatus} 
            isCrypto={isCrypto} 
          />

        </div>
"""

new_content = content_norm[:start_idx] + replacement_text + content_norm[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement successful!")
