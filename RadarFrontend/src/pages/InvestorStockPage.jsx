import React, { useState } from 'react';
import { 
  Bell, 
  User, 
  Plus, 
  TrendingUp, 
  ShieldCheck, 
  Lightbulb, 
  Activity, 
  BarChart3, 
  Clock, 
  Newspaper, 
  ChevronRight,
  TrendingDown,
  Info,
  ChevronsUpDown,
  Sliders,
  ChevronLeft,
  CandlestickChart,
  Bookmark,
  AlertCircle,
  Zap,
  HelpCircle,
  Search,
  Building2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Legend
} from 'recharts';
import Header from '../components/common/Header';
import './InvestorStockPage.css';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Enhanced Mock Data for different chart types
const chartData = [
  { time: '9:30', price: 480, open: 470, high: 490, low: 465, close: 480 },
  { time: '10:30', price: 512, open: 480, high: 520, low: 475, close: 512 },
  { time: '11:30', price: 505, open: 512, high: 515, low: 495, close: 505 },
  { time: '12:30', price: 545, open: 505, high: 550, low: 500, close: 545 },
  { time: '1:30', price: 532, open: 545, high: 550, low: 525, close: 532 },
  { time: '2:30', price: 555, open: 532, high: 560, low: 530, close: 555 },
  { time: '3:30', price: 562.90, open: 555, high: 570, low: 550, close: 562.90 },
];

const financialsData = [
  { name: '2021', revenue: 950, profit: 120 },
  { name: '2022', revenue: 1100, profit: 155 },
  { name: '2023', revenue: 1350, profit: 190 },
  { name: '2024', revenue: 1708, profit: 245 },
];

const InvestorStockPage = () => {
  const { symbol = 'JINDRILL' } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeFilter, setTimeFilter] = useState('1M');
  const [finTab, setFinTab] = useState('Revenue');
  const [finType, setFinType] = useState('Yearly');
  const [exchange, setExchange] = useState('NSE');
  const [chartType, setChartType] = useState('area');
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isAlertOn, setIsAlertOn] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // New Dynamic Data States
  const [financialData, setFinancialData] = useState(null);
  const [newsImpactData, setNewsImpactData] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState(null);

  useEffect(() => {
    // Synchronize with the Dashboard's premium "Minimalist Sky" gradient
    const fullBackground = 'linear-gradient(180deg, #f0f9ff 0%, #e1effe 100%)';
    document.body.style.backgroundColor = '#f0f9ff';
    document.body.style.backgroundImage = fullBackground;
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundSize = '';
    };
  }, []);

  // Fetch Logic
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setIsLoadingMetrics(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [finRes, newsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/stocks/financials?symbol=${symbol}`, config),
          axios.get(`http://localhost:5000/api/stocks/news?symbol=${symbol}`, config)
        ]);

        setFinancialData(finRes.data);
        setNewsImpactData(newsRes.data);
        setErrorMetrics(null);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setErrorMetrics("Data unavailable. Please try again later.");
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchDynamicData();
    const interval = setInterval(fetchDynamicData, 300000); // 5 min auto-refresh
    return () => clearInterval(interval);
  }, [symbol]);

  const getMetricData = () => {
    if (!financialData?.data) return [];
    if (finTab === 'Revenue') return financialData.data.revenue.map(d => ({ name: d.year, value: d.value, color: '#3b82f6' }));
    if (finTab === 'Profit') return financialData.data.profit.map(d => ({ name: d.year, value: d.value, color: '#10b981' }));
    return financialData.data.shareholding || [];
  };

  const handleExchangeChange = () => {
    setIsChartLoading(true);
    setExchange(prev => prev === 'NSE' ? 'BSE' : 'NSE');
    setTimeout(() => setIsChartLoading(false), 800); // Shimmer effect
  };

  const RenderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 0, left: 0, bottom: 0 }
    };

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" hide={true} />
          <YAxis hide={true} domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '700' }} 
            cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#premiumGradient)" />
        </AreaChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" hide={true} />
          <YAxis hide={true} domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '700' }} 
          />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" hide={true} />
          <YAxis hide={true} domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '700' }} 
          />
          <Bar dataKey="price" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      );
    }

    if (chartType === 'candle') {
      return (
        <ComposedChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" hide={true} />
          <YAxis hide={true} domain={['dataMin - 20', 'dataMax + 20']} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '700' }} 
          />
          {/* Candle Wicks (High/Low) */}
          <Bar dataKey={(d) => [d.low, d.high]} fill="#cbd5e1" barSize={2} />
          {/* Candle Body (Open/Close) */}
          <Bar 
            dataKey={(d) => [d.open, d.close]} 
            barSize={14}
            shape={(props) => {
              const { x, y, width, height, payload } = props;
              const fill = payload.close > payload.open ? '#10b981' : '#ef4444';
              return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} ry={2} />;
            }}
          />
        </ComposedChart>
      );
    }
  };

  return (
    <div className="dashboard-container investor-theme pt-4">
      <Header activeModule="STOCKS" onToggleMode={() => {}} />

      <main className="main-content">
        <div className="page-container">
          
          <div className="stock-chart-card animate-fade-in">
            <div className="chart-card-header">
              <div className="header-left-info">
                <div className="meta-row">
                  <span className="symbol-name">{symbol}</span>
                  <div className="exchange-switcher">
                    <button className="ex-arrow-btn" onClick={handleExchangeChange}>
                      <ChevronLeft size={16} />
                    </button>
                    <span className="ex-current">{exchange}</span>
                    <button className="ex-arrow-btn" onClick={handleExchangeChange}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <h1 className="stock-main-title">{symbol === 'JINDRILL' ? 'Jindal Drilling & Industries' : symbol}</h1>
              </div>

              <div className="header-right-actions">
                <button 
                  className={`icon-action-btn ${isAlertOn ? 'active' : ''}`}
                  onClick={() => setIsAlertOn(!isAlertOn)}
                  title="Price Alert"
                >
                  <Bell size={18} />
                </button>
                <button 
                  className={`icon-action-btn ${isInWatchlist ? 'active' : ''}`}
                  onClick={() => setIsInWatchlist(!isInWatchlist)}
                  title="Add to Watchlist"
                >
                  <Bookmark size={18} />
                </button>
                <button className="advanced-chart-btn">
                  <TrendingUp size={16} />
                  Advanced Chart
                </button>
              </div>
            </div>

            <div className="card-price-section">
              <span className="card-price-main">₹562.90</span>
              <span className="card-price-change">+77.00 (15.84%)</span>
              <span className="card-price-time">Live • Real-time Data</span>
            </div>

            <div className="chart-body">
              {isChartLoading && (
                <div className="chart-shimmer-overlay">
                  <div className="shimmer-anim"></div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                {RenderChart()}
              </ResponsiveContainer>
            </div>

            <div className="card-footer-controls">
              <div className="time-filters-group">
                {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'All'].map(filter => (
                  <button 
                    key={filter}
                    className={`time-pill ${timeFilter === filter ? 'active' : ''}`}
                    onClick={() => setTimeFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="control-divider"></div>

              <div className="chart-type-group">
                <button 
                  className={`type-pill ${chartType === 'area' ? 'active' : ''}`}
                  onClick={() => setChartType('area')}
                >
                  <Activity size={18} />
                </button>
                <button 
                  className={`type-pill ${chartType === 'line' ? 'active' : ''}`}
                  onClick={() => setChartType('line')}
                >
                  <TrendingUp size={18} />
                </button>
                <button 
                  className={`type-pill ${chartType === 'candle' ? 'active' : ''}`}
                  onClick={() => setChartType('candle')}
                >
                  <CandlestickChart size={18} />
                </button>
                <button 
                  className={`type-pill ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="stock-tabs-nav animate-fade-in">
            {['Overview', 'Fundamentals', 'Signals', 'News & Events'].map(tab => (
              <button 
                key={tab} 
                className={`stock-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && <div className="active-tab-line"></div>}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <div className="overview-section">
              <div className="price-overview-fintech animate-fade-in">
                <div className="po-container-card shadow-premium">
                  <div className="po-header-row">
                    <div className="po-title-group">
                      <h3 className="po-main-title">Price Overview</h3>
                      <Info size={14} className="po-info-icon" />
                    </div>
                    <div className="po-badge-tag">Trading near upper range</div>
                  </div>
                  
                  <div className="po-ranges-stack">
                    <div className="po-range-item">
                      <div className="po-range-header">
                        <span className="po-range-label">Today's Range</span>
                      </div>
                      <div className="po-visual-track-wrap">
                        <span className="po-limit-price">₹485.00</span>
                        <div className="po-track-main today-gradient">
                          <div className="po-marker-assembly" style={{ left: '85%' }}>
                            <div className="po-floating-price">₹562.90 • Current</div>
                            <div className="po-marker-v-line"></div>
                            <div className="po-marker-dot"></div>
                          </div>
                        </div>
                        <span className="po-limit-price">₹570.00</span>
                      </div>
                    </div>

                    <div className="po-range-item">
                      <div className="po-range-header">
                        <span className="po-range-label">52 Week Range</span>
                        <span className="po-context-indicator">Near 52W High</span>
                      </div>
                      <div className="po-visual-track-wrap">
                        <span className="po-limit-price">₹212.10</span>
                        <div className="po-track-main fiftytwo-gradient">
                          <div className="po-marker-assembly" style={{ left: '92%' }}>
                            <div className="po-marker-dot marker-muted"></div>
                          </div>
                        </div>
                        <span className="po-limit-price">₹585.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="po-stats-row-fintech">
                    <div className="po-stat-card-luxury">
                      <div className="ps-icon-circle bg-blue-soft"><Clock size={16} /></div>
                      <div className="ps-data">
                        <span className="ps-label">Open</span>
                        <span className="ps-value">₹492.10</span>
                      </div>
                    </div>
                    <div className="po-stat-card-luxury">
                      <div className="ps-icon-circle bg-green-soft"><TrendingUp size={16} /></div>
                      <div className="ps-data">
                        <span className="ps-label">Prev Close</span>
                        <span className="ps-value">₹485.90</span>
                      </div>
                    </div>
                    <div className="po-stat-card-luxury">
                      <div className="ps-icon-circle bg-purple-soft"><Activity size={16} /></div>
                      <div className="ps-data">
                        <span className="ps-label">Volume</span>
                        <span className="ps-value">61.5M</span>
                      </div>
                    </div>
                    <div className="po-stat-card-luxury">
                      <div className="ps-icon-circle bg-orange-soft"><ShieldCheck size={16} /></div>
                      <div className="ps-data">
                        <span className="ps-label">Circuit Range</span>
                        <span className="ps-value text-sm-luxury">₹450 – ₹675</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="key-metrics-compact-row animate-fade-in">
                {[
                  { label: 'Market Cap', val: '₹1,708 Cr', tag: 'Mid Cap', hint: 'Top 250 Company', type: 'neutral' },
                  { label: 'P/E Ratio', val: '9.2', tag: 'Undervalued', hint: 'Below Industry Avg', type: 'green' },
                  { label: 'ROE', val: '14.7%', tag: 'Strong', hint: 'Consistent returns', type: 'green' },
                  { label: 'Debt to Equity', val: '0.12', tag: 'Low Risk', hint: 'Very healthy', type: 'green' },
                  { label: 'Revenue Growth', val: '12.4%', tag: 'Stable', hint: 'YoY Growth', type: 'neutral' },
                  { label: 'Profit Margin', val: '11.4%', tag: 'Healthy', hint: 'Post-tax earnings', type: 'green' },
                ].map((m, i) => (
                  <div key={i} className="km-card">
                    <span className="km-label">{m.label}</span>
                    <div className="km-val-box">
                      <span className="km-value">{m.val}</span>
                      <span className={`km-status tag-${m.type}`}>{m.tag}</span>
                    </div>
                    <span className="km-hint">{m.hint}</span>
                  </div>
                ))}
              </div>

              <div className="radar-layout-stack animate-fade-in">
                <div className="radar-card about-company-row">
                  <div className="about-col-text">
                    <div className="rc-title-row">
                      <Building2 className="rc-icon" />
                      <h3>About Company</h3>
                    </div>
                    <p className="about-text-clean">
                      Jindal Drilling and Industries Limited (JDIL) is a leading provider of services 
                      to the oil and gas sector in India. Part of the DP Jindal Group, JDIL provides offshore 
                      drilling services to major global and national oil companies.
                    </p>
                    <button className="text-blue-500 font-bold text-xs mt-2">READ MORE</button>
                  </div>
                  <div className="about-col-meta">
                    <div className="meta-grid">
                      <div className="meta-item">
                        <span className="meta-l">Sector</span>
                        <span className="meta-v">Energy</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-l">Industry</span>
                        <span className="meta-v">Drilling Services</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-l">Founded</span>
                        <span className="meta-v">1983</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-l">Headquarters</span>
                        <span className="meta-v">New Delhi, India</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="radar-row-flex">
                  <div className="radar-card financial-performance-card flex-grow-main overflow-hidden">
                    <div className="rc-header">
                      <div className="rc-header-left">
                        <BarChart3 className="rc-icon" />
                        <div>
                          <h3>Financial Performance</h3>
                          {financialData?.source && financialData.source !== 'live' && (
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">
                              {financialData.source === 'cached' ? 'Updated recently' : 'Showing last available data'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="b-tabs">
                        {['Revenue', 'Profit', 'Share'].map(t => (
                          <button key={t} onClick={() => setFinTab(t === 'Share' ? 'Shareholding' : t)} className={finTab.startsWith(t) ? 'active' : ''}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="rc-content">
                      {isLoadingMetrics ? (
                        <div className="metric-skeleton-chart animate-pulse bg-slate-100/50 rounded-2xl h-[220px] w-full" />
                      ) : errorMetrics ? (
                        <div className="h-[220px] flex items-center justify-center text-xs text-slate-400 font-bold">{errorMetrics}</div>
                      ) : (
                        <div className="b-canvas" style={{ height: '220px', marginTop: '20px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getMetricData()}>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                              <Tooltip cursor={{fill: '#f8fafc', radius: 4}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 15px rgba(0,0,0,0.05)' }} />
                              <Bar 
                                name={finTab === 'Shareholding' ? 'Ownership %' : `${finTab} (₹ Cr)`} 
                                dataKey="value" 
                                fill={finTab === 'Profit' ? '#10b981' : '#3b82f6'} 
                                radius={[6, 6, 0, 0]} 
                                barSize={finTab === 'Shareholding' ? 48 : 32} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="radar-card news-impact-card flex-grow-side">
                    <div className="rc-header">
                      <div className="rc-header-left">
                        <Zap className="rc-icon" />
                        <div>
                          <h3>News & Impact</h3>
                          {newsImpactData?.source && newsImpactData.source !== 'live' && (
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Last synced {newsImpactData.source}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rc-content">
                      {isLoadingMetrics ? (
                        <div className="space-y-4 pt-2">
                          {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />)}
                        </div>
                      ) : (
                        <div className="news-impact-list">
                          {(newsImpactData?.data || []).map((n, i) => (
                            <div key={i} className="news-impact-item">
                              <div className="ni-top">
                                <span className={`ni-tag tag-${i === 0 ? 'green' : i === 1 ? 'blue' : 'purple'}`}>{n.category.toUpperCase()}</span>
                                <p className="ni-head">{financialData?.data?.revenue?.[financialData.data.revenue.length-1]?.year} Forward Outlook</p>
                              </div>
                              <div className="news-impact-points mt-1">
                                {n.points.map((p, pi) => (
                                  <div key={pi} className="ni-interpretation mb-1">
                                    <div className="ni-dot"></div>
                                    <span>{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="radar-row-flex">
                  <div className="radar-card note-card-horizontal flex-equal">
                    <div className="rc-header">
                      <div className="rc-header-left">
                        <Info className="rc-icon" />
                        <h3>Things to Note</h3>
                      </div>
                    </div>
                    <div className="rc-content">
                      <div className="note-list-compact">
                        <div className="note-item-c">
                          <div className="n-dot bg-blue-500"></div>
                          <p>Consistent financial performance observed across multiple business cycles.</p>
                        </div>
                        <div className="note-item-c">
                          <div className="n-dot bg-green-500"></div>
                          <p>Sector tailwinds remain supportive due to increased offshore activity.</p>
                        </div>
                        <div className="note-item-c">
                          <div className="n-dot bg-amber-500"></div>
                          <p>Valuation gap still exists relative to sector intrinsic potential.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="radar-card signals-card-visual flex-equal">
                    <div className="rc-header">
                      <div className="rc-header-left">
                        <TrendingUp className="rc-icon" />
                        <h3>Long-Term Signals</h3>
                      </div>
                    </div>
                    <div className="rc-content">
                      <div className="signals-visual-list">
                        {[
                          { label: 'Financial Strength', val: 'Strong', color: 'green', pct: 85 },
                          { label: 'Growth Potential', val: 'High', color: 'green', pct: 72 },
                          { label: 'Risk Level', val: 'Moderate', color: 'amber', pct: 45 },
                          { label: 'Valuation', val: 'Undervalued', color: 'green', pct: 90 },
                        ].map((s, i) => (
                          <div key={i} className="sig-vis-item">
                            <div className="sv-top">
                              <span className="sv-label">{s.label}</span>
                              <span className={`sv-status text-${s.color}`}>{s.val}</span>
                            </div>
                            <div className="sv-progress-bg">
                              <div className={`sv-progress-fill bg-${s.color}`} style={{ width: `${s.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Signals' && (
            <div className="signals-tab-content animate-fade-in">
              {/* 1. SIGNAL SUMMARY CARD (ACTIONABLE TOP LAYER) */}
              <div className="signal-summary-card shadow-premium">
                <div className="ss-top-row">
                  <div className="ss-sentiment-box">
                    <span className="ss-sub">Current Sentiment</span>
                    <h2 className="ss-main-label text-green">Strongly Bullish</h2>
                  </div>
                  <div className="ss-score-box">
                    <div className="ss-score-circle">
                      <span className="ss-score-num">8.2</span>
                      <span className="ss-score-max">/10</span>
                    </div>
                    <span className="ss-score-label">Strong Setup</span>
                  </div>
                </div>

                <div className="ss-meter-container">
                  <div className="ss-meter-labels">
                    <span>Bearish</span>
                    <span>Neutral</span>
                    <span>Bullish</span>
                  </div>
                  <div className="ss-meter-track">
                    <div className="ss-meter-fill" style={{ width: '82%' }}></div>
                    <div className="ss-meter-thumb" style={{ left: '82%' }}></div>
                  </div>
                </div>

                <div className="ss-explanation-box">
                  <Zap size={16} className="text-amber-500" />
                  <p>Momentum indicators suggest a bullish continuation with strong trend support at the 50-day moving average.</p>
                </div>
              </div>

              {/* 2. TIMEFRAME SWITCHER */}
              <div className="signals-timeframe-bar">
                {['Short Term', 'Medium Term', 'Long Term'].map(t => (
                  <button key={t} className={`st-pill ${t === 'Short Term' ? 'active' : ''}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* 3. CORE SIGNAL CATEGORIES */}
              <div className="signals-grid">
                {/* A. Trend Signals */}
                <div className="sig-category-card">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <TrendingUp className="rc-icon" />
                      <h3>Trend Signals</h3>
                    </div>
                  </div>
                  <div className="sig-list">
                    {[
                      { name: 'MA Trend', val: 'Moving Avg', status: 'BULLISH', s: 'green', imp: 'Price is sustaining above 50 & 200 DMA' },
                      { name: 'Price vs 200DMA', val: '₹488.20', status: 'STRONG', s: 'green', imp: 'Trading 15% above the long-term baseline' },
                      { name: 'Trend Strength', val: 'ADX: 28', status: 'BULLISH', s: 'green', imp: 'Trend is gaining significant strength' },
                    ].map((s, i) => (
                      <div key={i} className="sig-item-card">
                        <div className="sig-item-top">
                          <span className="sig-name">{s.name} <Info size={12} className="text-slate-300" /></span>
                          <span className="sig-val">{s.val}</span>
                          <span className={`sig-badge tag-${s.s}`}>{s.status}</span>
                        </div>
                        <p className="sig-interpretation">{s.imp}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* B. Momentum Signals */}
                <div className="sig-category-card">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <Zap className="rc-icon" />
                      <h3>Momentum Signals</h3>
                    </div>
                  </div>
                  <div className="sig-list">
                    {[
                      { name: 'RSI (14)', val: '68.5', status: 'OVERBOUGHT', s: 'amber', imp: 'RSI indicates stock is nearing the overbought zone' },
                      { name: 'MACD', val: 'Crossover', status: 'BULLISH', s: 'green', imp: 'Bullish crossover confirmed on daily chart' },
                      { name: 'Volume Trend', val: '1.5x Avg', status: 'STRONG', s: 'green', imp: 'Rising volume supporting the upward move' },
                    ].map((s, i) => (
                      <div key={i} className="sig-item-card">
                        <div className="sig-item-top">
                          <span className="sig-name">{s.name} <Info size={12} className="text-slate-300" /></span>
                          <span className="sig-val">{s.val}</span>
                          <span className={`sig-badge tag-${s.s}`}>{s.status}</span>
                        </div>
                        <p className="sig-interpretation">{s.imp}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* C. Volatility & Risk */}
                <div className="sig-category-card">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <Activity className="rc-icon" />
                      <h3>Volatility & Risk</h3>
                    </div>
                  </div>
                  <div className="sig-list">
                    {[
                      { name: 'ATR (Volatility)', val: '12.4', status: 'MODERATE', s: 'amber', imp: 'Moderate volatility expected in current range' },
                      { name: 'Beta', val: '0.92', status: 'LOW RISK', s: 'green', imp: 'Stock is less volatile than the benchmark index' },
                      { name: 'Price Swings', val: 'Weekly', status: 'STABLE', s: 'green', imp: 'Price action remains stable without erratic gaps' },
                    ].map((s, i) => (
                      <div key={i} className="sig-item-card">
                        <div className="sig-item-top">
                          <span className="sig-name">{s.name} <Info size={12} className="text-slate-300" /></span>
                          <span className="sig-val">{s.val}</span>
                          <span className={`sig-badge tag-${s.s}`}>{s.status}</span>
                        </div>
                        <p className="sig-interpretation">{s.imp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. KEY LEVELS & VOLUME INSIGHTS */}
              <div className="signals-row-flex mb-8">
                <div className="sig-card-mid flex-equal">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <BarChart3 className="rc-icon" />
                      <h3>Key Price Levels</h3>
                    </div>
                  </div>
                  <div className="kl-visual-range">
                    <div className="kl-track">
                      <div className="kl-marker kl-s2" style={{ left: '10%' }}><span>₹512 (S2)</span></div>
                      <div className="kl-marker kl-s1" style={{ left: '30%' }}><span>₹535 (S1)</span></div>
                      <div className="kl-current-thumb" style={{ left: '72%' }}>
                        <div className="kl-p-label">₹562.90</div>
                        <div className="kl-p-dot"></div>
                      </div>
                      <div className="kl-marker kl-r1" style={{ left: '85%' }}><span>₹585 (R1)</span></div>
                      <div className="kl-marker kl-r2" style={{ left: '95%' }}><span>₹612 (R2)</span></div>
                    </div>
                  </div>
                  <div className="kl-interpretation-footer mt-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Price is currently <span className="text-blue-600">approaching resistance R1</span>. Strong support cluster observed near ₹535.
                    </p>
                  </div>
                </div>

                <div className="sig-card-mid flex-equal">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <Activity className="rc-icon" />
                      <h3>Volume Insights</h3>
                    </div>
                  </div>
                  <div className="vi-metrics-row">
                    <div className="vi-stat-box">
                      <span className="vi-label">Volume vs Avg</span>
                      <span className="vi-value">1.58x <small className="text-green">Increasing</small></span>
                    </div>
                    <div className="vi-stat-box">
                      <span className="vi-label">Conviction</span>
                      <span className="vi-value text-green">Strong</span>
                    </div>
                  </div>
                  <div className="vi-note-box bg-slate-50 p-3 rounded-xl mt-4">
                    <p className="text-xs leading-relaxed text-slate-600">
                      Rising volume on price up-moves supports the current trend conviction. Market participation is above average for this session.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. PRICE BEHAVIOR & MARKET PARTICIPATION */}
              <div className="signals-row-flex mb-8">
                <div className="sig-card-mid flex-equal">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <Sliders className="rc-icon" />
                      <h3>Price Behavior</h3>
                    </div>
                  </div>
                  <ul className="pb-list">
                    <li>
                      <span className="pb-l">Recent Trend</span>
                      <span className="pb-v text-green">Higher Highs</span>
                    </li>
                    <li>
                      <span className="pb-l">Current Phase</span>
                      <span className="pb-v">Breakout Testing</span>
                    </li>
                    <li>
                      <span className="pb-l">Conviction Score</span>
                      <span className="pb-v">High</span>
                    </li>
                  </ul>
                  <p className="text-[11px] text-slate-400 italic mt-3">"Stock forming higher highs, indicating a sustained medium-term uptrend."</p>
                </div>

                <div className="sig-card-mid flex-equal">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <ShieldCheck className="rc-icon" />
                      <h3>Market Participation</h3>
                    </div>
                  </div>
                  <ul className="pb-list">
                    <li>
                      <span className="pb-l">Delivery %</span>
                      <span className="pb-v">48.2%</span>
                    </li>
                    <li>
                      <span className="pb-l">Participation</span>
                      <span className="pb-v text-green">Institution Led</span>
                    </li>
                    <li>
                      <span className="pb-l">Accumulation</span>
                      <span className="pb-v text-green">Strong Buy</span>
                    </li>
                  </ul>
                  <p className="text-[11px] text-slate-400 italic mt-3">"Higher delivery volumes suggest structural long-term accumulation interest."</p>
                </div>
              </div>

              {/* 6. TREND ALIGNMENT & SIGNAL CONSISTENCY */}
              <div className="signals-row-flex mb-8">
                <div className="sig-card-mid flex-equal">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <ChevronsUpDown className="rc-icon" />
                      <h3>Trend Alignment</h3>
                    </div>
                  </div>
                  <div className="ta-alignment-row">
                    <div className="ta-pill-group">
                      <div className="ta-pill bg-green">Short Term</div>
                      <div className="ta-pill bg-blue">Medium Term</div>
                      <div className="ta-pill bg-green">Long Term</div>
                    </div>
                  </div>
                  <div className="ta-footer mt-4">
                    <span className="badge-light text-green">SYNCHRONIZED</span>
                    <p className="text-[12px] text-slate-500 mt-2">Overall trend alignment supports a clear bullish bias across timeframes.</p>
                  </div>
                </div>

                <div className="sig-card-mid flex-equal">
                  <div className="sig-cat-header">
                    <Clock size={18} className="text-slate-500" />
                    <h3>Signal Consistency</h3>
                  </div>
                  <div className="sc-consistency-view">
                    <div className="sc-track">
                      {[1,1,1,1,1,0.5,1].map((s, i) => (
                        <div key={i} className={`sc-dot ${s === 1 ? 'bg-green' : 'bg-slate-200'}`}></div>
                      ))}
                    </div>
                    <span className="sc-total">86% Bullish</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-4">Bullish signals have been consistently sustained over the last 5 trading sessions.</p>
                </div>
              </div>

              {/* 7. RISK ALERTS & RECENT CHANGES */}
              <div className="signals-row-flex mb-8">
                <div className="sig-card-mid risk-alerts-card flex-grow-side">
                  <div className="rc-header">
                    <div className="rc-header-left">
                      <AlertCircle className="rc-icon" />
                      <h3>Risk Alerts</h3>
                    </div>
                  </div>
                  <div className="risk-alerts-list">
                    <div className="ra-item alert-amber">
                      <div className="ra-dot"></div>
                      <p><strong>Overbought:</strong> RSI (14) is nearing overbought levels at 68.5.</p>
                    </div>
                    <div className="ra-item alert-purple">
                        <div className="ra-dot"></div>
                        <p><strong>Volatility:</strong> ATR is rising — expect sharper intraday moves.</p>
                    </div>
                  </div>
                </div>

                <div className="sig-card-mid flex-grow-main">
                  <div className="sig-cat-header">
                    <Clock size={18} className="text-indigo-500" />
                    <h3>Recent Changes</h3>
                  </div>
                  <div className="recent-changes-list">
                    <div className="rc-item-s">
                      <span className="rc-time-s">TODAY</span>
                      <p className="rc-desc-s">Price successfully crossed the <strong>50 DMA (₹542)</strong> with rising volume.</p>
                    </div>
                    <div className="rc-item-s">
                      <span className="rc-time-s">YESTERDAY</span>
                      <p className="rc-desc-s">MACD Bullish crossover confirmed on the daily timeframe.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. WHAT THIS MEANS SECTION */}
              <div className="sig-meaning-box animate-fade-in">
                <div className="sm-header">
                  <Lightbulb className="text-amber-500" size={20} />
                  <h3>What This Means</h3>
                </div>
                <div className="sm-content-layout">
                  <ul className="sm-list">
                    <li>The stock is in a strong momentum-driven uptrend, supported by institutional accumulation.</li>
                    <li>While long-term outlook remains bullish, stay cautious of short-term consolidation near the ₹585 resistance.</li>
                    <li>Trend synchronization across short and long timeframes suggests a high-probability bullish structure.</li>
                  </ul>
                  <div className="sm-disclaimer mt-6">
                    <Info size={14} />
                    <span>This interpretation is based on historical technical data and algorithmic analysis. Not financial advice.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Fundamentals' && (
            <div className="fundamentals-tab-rich animate-fade-in">
              {/* 1. GROWW-STYLE COMPANY FUNDAMENTALS TABLE */}
              <div className="ft-main-snapshot-card shadow-premium">
                <div className="ft-header-row-snap">
                  <div className="ft-title-group">
                    <Activity size={20} className="text-blue-600" />
                    <h2>Company Fundamentals</h2>
                  </div>
                  <span className="ft-sub-text">All figures in ₹ Cr unless specified</span>
                </div>

                <div className="ft-rich-table-grid">
                  {/* Left Column of Table */}
                  <div className="ft-table-side">
                    {[
                      { name: 'Market Cap', val: '1,708', status: 'Mid Cap', type: 'neutral', hint: 'Top 250 Company', info: 'Total market value of all outstanding shares.' },
                      { name: 'P/E Ratio (TTM)', val: '9.21', status: 'Undervalued', type: 'green', hint: 'Below industry avg (18.4)', info: 'Price-to-Earnings ratio.' },
                      { name: 'P/B Ratio', val: '1.45', status: 'Healthy', type: 'green', hint: 'Asset-rich valuation', info: 'Price-to-Book ratio.' },
                      { name: 'EV / EBITDA', val: '6.80', status: 'Strong', type: 'green', hint: 'Efficient cash generation', info: 'Enterprise Value to EBITDA.' },
                      { name: 'PEG Ratio', val: '0.92', status: 'Undervalued', type: 'green', hint: 'Growth-adjusted value', info: 'P/E to Growth ratio.' },
                      { name: 'ROE (%)', val: '14.7%', status: 'Strong', type: 'green', hint: 'Consistent capital returns', info: 'Return on Equity.' },
                      { name: 'ROCE (%)', val: '18.2%', status: 'Superior', type: 'green', hint: 'High operating efficiency', info: 'Return on Capital Employed.' },
                      { name: 'Div Yield', val: '0.85%', status: 'Moderate', type: 'neutral', hint: 'Consistent annual payouts', info: 'Annual dividend yield.' },
                    ].map((m, i) => (
                      <div key={i} className="ft-table-row-item">
                        <div className="ft-row-label">
                          <span>{m.name}</span>
                          <div className="info-trigger-s">
                            <HelpCircle size={13} />
                            <div className="ft-dropdown-s"><strong>{m.name}:</strong> {m.info}</div>
                          </div>
                        </div>
                        <div className="ft-row-data">
                          <div className="ft-val-top">
                            <span className="ft-val-bold">{m.val}</span>
                            <span className={`ft-status-pill tag-${m.type}`}>{m.status}</span>
                          </div>
                          <span className="ft-val-hint">{m.hint}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column of Table */}
                  <div className="ft-table-side">
                    {[
                      { name: 'Debt to Equity', val: '0.12', status: 'Low Risk', type: 'green', hint: 'Healthy balance sheet', info: 'Proportion of debt relative to equity.' },
                      { name: 'Int. Coverage', val: '14.2', status: 'Superior', type: 'green', hint: 'Easily services debt', info: 'Ability to pay interest.' },
                      { name: 'Current Ratio', val: '2.45', status: 'Stable', type: 'green', hint: 'Good short-term liquidity', info: 'Assets to liabilities.' },
                      { name: 'Rev Growth (YoY)', val: '12.4%', status: 'Consistent', type: 'green', hint: 'Stable top-line growth', info: 'Year-over-year sales.' },
                      { name: 'Profit Growth', val: '8.9%', status: 'Positive', type: 'green', hint: 'Bottom-line expansion', info: 'Year-over-year profit.' },
                      { name: 'EPS (TTM)', val: '54.20', status: 'Rising', type: 'green', hint: 'Earnings per share info', info: 'Per share profit.' },
                      { name: 'Book Value', val: '388.15', status: 'Strong', type: 'green', hint: 'Asset-back valuation', info: 'Asset value per share.' },
                      { name: 'Face Value', val: '10.00', status: 'Standard', type: 'neutral', hint: 'Standard equity value', info: 'Initial stock cost.' },
                    ].map((m, i) => (
                      <div key={i} className="ft-table-row-item">
                        <div className="ft-row-label">
                          <span>{m.name}</span>
                          <div className="info-trigger-s">
                            <HelpCircle size={13} />
                            <div className="ft-dropdown-s"><strong>{m.name}:</strong> {m.info}</div>
                          </div>
                        </div>
                        <div className="ft-row-data">
                          <div className="ft-val-top">
                            <span className="ft-val-bold">{m.val}</span>
                            <span className={`ft-status-pill tag-${m.type}`}>{m.status}</span>
                          </div>
                          <span className="ft-val-hint">{m.hint}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. DETAILED ANALYSIS SECTION */}
              <div className="ft-detailed-header mt-12 mb-6">
                <div className="ft-title-row">
                  <TrendingUp size={20} className="text-blue-500" />
                  <h2>Detailed Analysis</h2>
                </div>
                <p>Granular breakdown of financial metrics and competitive standing.</p>
              </div>

              <div className="ft-detailed-layout-grid">
                {/* A. Valuation */}
                <div className="ft-analysis-card">
                  <div className="fac-header">Valuation Metrics</div>
                  <div className="fac-list">
                    {[
                      { n: 'P/E (TTM)', v: '9.21', label: 'Undervalued', t: 'green', sub: 'Below Industry Average' },
                      { n: 'Price to Book', v: '1.45', label: 'Healthy', t: 'green', sub: 'Fair relative to assets' },
                      { n: 'EV / EBITDA', v: '6.80', label: 'Strong', t: 'green', sub: 'Good cash flow proxy' },
                      { n: 'PEG Ratio', v: '0.92', label: 'Growth Value', t: 'green', sub: 'Cheap adjusted for growth' },
                    ].map((m, i) => (
                      <div key={i} className="fac-item">
                        <div className="fac-left">
                          <span className="fac-n">{m.n}</span>
                          <span className="fac-sub">{m.sub}</span>
                        </div>
                        <div className="fac-right">
                          <span className="fac-v">{m.v}</span>
                          <span className={`fac-label text-${m.t}`}>{m.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* B. Profitability */}
                <div className="ft-analysis-card">
                  <div className="fac-header">Profitability</div>
                  <div className="fac-list">
                    {[
                      { n: 'ROE', v: '14.7%', label: 'Strong', t: 'green', sub: 'Efficient equity usage' },
                      { n: 'ROCE', v: '18.2%', label: 'Superior', t: 'green', sub: 'Optimal capital management' },
                      { n: 'Operating Margin', v: '22.8%', label: 'High', t: 'green', sub: 'Core business efficiency' },
                      { n: 'Net Profit Margin', v: '11.4%', label: 'Stable', t: 'green', sub: 'Final post-tax margin' },
                    ].map((m, i) => (
                      <div key={i} className="fac-item">
                        <div className="fac-left">
                          <span className="fac-n">{m.n}</span>
                          <span className="fac-sub">{m.sub}</span>
                        </div>
                        <div className="fac-right">
                          <span className="fac-v">{m.v}</span>
                          <span className={`fac-label text-${m.t}`}>{m.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* C. Growth */}
                <div className="ft-analysis-card">
                  <div className="fac-header">Growth Profile</div>
                  <div className="fac-list">
                    {[
                      { n: 'Rev Growth (3Y)', v: '12.4%', label: 'Stable', t: 'green', sub: 'YoY Revenue CAGR' },
                      { n: 'Profit Growth', v: '8.9%', label: 'Moderate', t: 'neutral', sub: 'Bottom-line expansion' },
                      { n: 'EPS Growth', v: '10.2%', label: 'Positive', t: 'green', sub: 'Consistent per-share gain' },
                    ].map((m, i) => (
                      <div key={i} className="fac-item">
                        <div className="fac-left">
                          <span className="fac-n">{m.n}</span>
                          <span className="fac-sub">{m.sub}</span>
                        </div>
                        <div className="fac-right">
                          <span className="fac-v">{m.v}</span>
                          <span className={`fac-label text-${m.t}`}>{m.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* D. Financial Health */}
                <div className="ft-analysis-card">
                  <div className="fac-header">Financial Health</div>
                  <div className="fac-list">
                    {[
                      { n: 'Debt to Equity', v: '0.12', label: 'Very Low', t: 'green', sub: 'Prudent debt management' },
                      { n: 'Int. Coverage', v: '14.2', label: 'Superior', t: 'green', sub: 'Safe interest repayments' },
                      { n: 'Current Ratio', v: '2.45', label: 'Robust', t: 'green', sub: 'Optimal liquidity profile' },
                    ].map((m, i) => (
                      <div key={i} className="fac-item">
                        <div className="fac-left">
                          <span className="fac-n">{m.n}</span>
                          <span className="fac-sub">{m.sub}</span>
                        </div>
                        <div className="fac-right">
                          <span className="fac-v">{m.v}</span>
                          <span className={`fac-label text-${m.t}`}>{m.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* E. Shareholder Metrics */}
                <div className="ft-analysis-card">
                  <div className="fac-header">Shareholder Metrics</div>
                  <div className="fac-list">
                    {[
                      { n: 'EPS (TTM)', v: '54.20', label: 'Rising', t: 'green', sub: 'Last 12 month earnings' },
                      { n: 'Dividend Yield', v: '0.85%', label: 'Moderate', t: 'neutral', sub: 'Annual yield percentage' },
                      { n: 'Book Value', v: '388.15', label: 'Strong', t: 'green', sub: 'Asset value per share' },
                    ].map((m, i) => (
                      <div key={i} className="fac-item">
                        <div className="fac-left">
                          <span className="fac-n">{m.n}</span>
                          <span className="fac-sub">{m.sub}</span>
                        </div>
                        <div className="fac-right">
                          <span className="fac-v">{m.v}</span>
                          <span className={`fac-label text-${m.t}`}>{m.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* F. Peer Comparison (NEW SECTION) */}
                <div className="ft-analysis-card ft-peer-card">
                  <div className="fac-header d-flex justify-between">
                    <span>Peer Comparison</span>
                    <span className="text-xs font-normal text-slate-400">Industry: Energy Services</span>
                  </div>
                  <div className="peer-comp-table">
                    <div className="pct-header">
                      <span>Metric</span>
                      <span>Company</span>
                      <span>Industry Avg</span>
                    </div>
                    {[
                      { n: 'P/E Ratio', c: '9.21', i: '18.4', t: 'green', d: 'down' },
                      { n: 'ROE', c: '14.7%', i: '11.2%', t: 'green', d: 'up' },
                      { n: 'Profit Margin', c: '11.4%', i: '8.5%', t: 'green', d: 'up' },
                      { n: 'Rev Growth', c: '12.4%', i: '9.5%', t: 'green', d: 'up' },
                    ].map((m, idx) => (
                      <div key={idx} className="pct-row">
                        <span className="pct-n">{m.n}</span>
                        <div className="pct-c-cell">
                          <span className="pct-val">{m.c}</span>
                          <div className={`pct-indicator text-${m.t}`}>
                            {m.d === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          </div>
                        </div>
                        <span className="pct-i">{m.i}</span>
                      </div>
                    ))}
                  </div>
                  <div className="peer-foot mt-4 border-t pt-3 border-slate-100">
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      JINDRILL outperforms industry averages in all core efficiency and growth benchmarks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'News & Events' && (
            <div className="news-events-tab animate-fade-in">
              {/* 1. Header with Filters */}
              <div className="ne-header-bar shadow-premium">
                <div className="ne-title-row">
                  <div className="ne-title-group">
                    <Newspaper size={20} className="text-blue-600" />
                    <h2>News & Events</h2>
                  </div>
                  <div className="ne-header-actions">
                    <div className="ne-dropdown-wrap">
                      <select className="ne-select-modern">
                        <option>Latest</option>
                        <option>Relevant</option>
                        <option>Top Impact</option>
                      </select>
                      <ChevronsUpDown size={14} className="ne-select-icon" />
                    </div>
                    <button className="ne-search-btn">
                      <Search size={18} />
                    </button>
                  </div>
                </div>

                <div className="ne-filter-pills mt-6">
                  {['All', 'News', 'Events'].map(p => (
                    <button key={p} className={`ne-pill ${p === 'All' ? 'active' : ''}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ne-content-layout mt-8">
                {/* 2. Upcoming Events (Timeline View) */}
                <div className="ne-events-section mb-10">
                  <div className="ne-section-header">
                    <Clock size={18} className="text-indigo-500" />
                    <h3>Upcoming Events</h3>
                  </div>

                  <div className="ne-timeline-container shadow-premium">
                    {[
                      { date: '12 May', title: 'Q4 Earnings Release', desc: 'Financial results for the quarter ended March 2024.', tag: 'QUARTERLY RESULTS', icon: 'bar', imp: 'Strong growth expected', s: 'green' },
                      { date: '28 May', title: 'Annual General Meeting', desc: 'Strategic roadmap and expansion plans discussion.', tag: 'AGM', icon: 'users', imp: 'Neutral impact on stock', s: 'amber' },
                      { date: '04 Jun', title: 'Dividend Payout', desc: 'Final dividend of ₹2.50 per share proposed.', tag: 'DIVIDEND', icon: 'coin', imp: 'Positive for shareholders', s: 'green' },
                    ].map((e, idx) => (
                      <div key={idx} className="ne-timeline-item">
                        <div className="ne-t-left">
                          <span className="ne-t-date">{e.date}</span>
                          <div className="ne-t-node">
                            <div className={`ne-t-icon-bg bg-${e.s}-soft`}>
                              {e.icon === 'bar' && <Activity size={14} />}
                              {e.icon === 'users' && <Building2 size={14} />}
                              {e.icon === 'coin' && <TrendingUp size={14} />}
                            </div>
                            {idx < 2 && <div className="ne-t-line"></div>}
                          </div>
                        </div>
                        <div className="ne-t-right">
                          <div className="ne-t-header">
                            <h4 className="ne-t-title">{e.title}</h4>
                            <span className="ne-t-tag">{e.tag}</span>
                          </div>
                          <p className="ne-t-desc">{e.desc}</p>
                          <div className={`ne-t-impact impact-${e.s}`}>
                            <div className="ne-dot"></div>
                            <span>{e.imp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Latest News (Card View) */}
                <div className="ne-news-section">
                  <div className="ne-section-header">
                    <TrendingUp size={18} className="text-blue-500" />
                    <h3>Latest News</h3>
                  </div>

                  <div className="ne-news-stack">
                    {[
                      { source: 'Reuters', time: '2h ago', head: 'Jindal Drilling bags new offshore contract worth ₹450Cr', desc: 'The contract involves deployment of the jack-up rig "Jindal Pioneer" for a period of 3 years.', imp: 'Positive for long-term growth', s: 'green' },
                      { source: 'Economic Times', time: '5h ago', head: 'Energy service sector awaits policy clarity on offshore taxes', desc: 'Industry leaders seek rationalization of GST on offshore drilling services in upcoming budget.', imp: 'Short-term volatility expected', s: 'amber' },
                      { source: 'Mint', time: 'Yesterday', head: 'JDIL shares surge 15% on strong volume breakout', desc: 'Technicals suggest strong accumulation by mid-cap focused funds.', imp: 'Momentum expected to continue', s: 'green' },
                    ].map((n, idx) => (
                      <div key={idx} className="ne-news-card shadow-premium border-l-[4px] border-l-blue-500">
                        <div className="ne-n-top">
                          <span className="ne-n-tag">NEWS</span>
                          <span className="ne-n-source">{n.source}</span>
                          <span className="ne-n-time">{n.time}</span>
                        </div>
                        <h4 className="ne-n-headline">{n.head}</h4>
                        <p className="ne-n-summary">{n.desc}</p>
                        <div className={`ne-n-interpretation impact-${n.s}`}>
                          <div className="ne-dot"></div>
                          <span>Interpretation: {n.imp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InvestorStockPage;
