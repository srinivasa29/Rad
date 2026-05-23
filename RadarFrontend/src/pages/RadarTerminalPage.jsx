import { useMemo, useState } from 'react';
import { Activity, Bell, Bolt, ChevronDown, CircleDot, Newspaper, Radio, Search, Shield, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import RadarLightweightChart from '../charts/RadarLightweightChart';
import useRadarTerminal from '../hooks/useRadarTerminal';
import './RadarTerminalPage.css';

const formatNumber = (value, digits = 2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

const signed = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0.00';
  return `${numeric > 0 ? '+' : ''}${numeric.toFixed(2)}`;
};

const Skeleton = () => (
  <div className="radar-terminal">
    <div className="radar-skeleton h-20" />
    <div className="radar-grid">
      <div className="radar-skeleton h-[620px]" />
      <div className="radar-skeleton h-[620px]" />
    </div>
  </div>
);

const TerminalCard = ({ children, className = '' }) => (
  <section className={`radar-card ${className}`}>{children}</section>
);

const Watchlist = ({ rows = [], ticks = {}, selectedSymbol, onSelect }) => {
  const [sort, setSort] = useState({ key: 'changePercent', dir: 'desc' });
  const sorted = useMemo(() => {
    const direction = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => (Number(a[sort.key]) - Number(b[sort.key])) * direction);
  }, [rows, sort]);

  const setSortKey = (key) => {
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
  };

  return (
    <TerminalCard className="radar-watchlist">
      <div className="radar-panel-head">
        <div>
          <p className="radar-eyebrow">Smart Watchlist</p>
          <h3>Realtime NSE Monitor</h3>
        </div>
        <button type="button" className="radar-icon-btn" title="Sort menu"><ChevronDown size={16} /></button>
      </div>
      <div className="radar-table">
        <div className="radar-table-row radar-table-head">
          <button onClick={() => setSortKey('symbol')}>Symbol</button>
          <button onClick={() => setSortKey('price')}>LTP</button>
          <button onClick={() => setSortKey('changePercent')}>Chg%</button>
          <button onClick={() => setSortKey('volumeShock')}>Vol</button>
        </div>
        <div className="radar-table-body">
          {sorted.map((item) => {
            const tick = ticks[item.symbol];
            const price = tick?.price ?? item.price;
            const change = tick?.changePercent ?? item.changePercent;
            const isPositive = Number(change) >= 0;
            return (
              <button
                type="button"
                key={item.symbol}
                onClick={() => onSelect(item.symbol)}
                className={`radar-table-row radar-watch-row ${selectedSymbol === item.symbol ? 'active' : ''}`}
              >
                <span>
                  <b>{item.symbol}</b>
                  <small>{item.sector}</small>
                </span>
                <span className="tabular-nums">Rs {formatNumber(price)}</span>
                <span className={isPositive ? 'radar-green' : 'radar-red'}>
                  {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {signed(change)}%
                </span>
                <span>{formatNumber(item.volumeShock, 1)}x</span>
              </button>
            );
          })}
        </div>
      </div>
    </TerminalCard>
  );
};

const IntelligencePanel = ({ research, scanners }) => {
  const snapshot = research?.indicators?.snapshot || {};
  const metrics = [
    { label: 'Bias', value: snapshot.bias || 'neutral', tone: snapshot.bias === 'bullish' ? 'green' : snapshot.bias === 'bearish' ? 'red' : 'cyan' },
    { label: 'Momentum', value: `${snapshot.momentumScore || 0}/100`, tone: 'cyan' },
    { label: 'Trend', value: `${snapshot.trendStrength || 0}/100`, tone: 'green' },
    { label: 'RSI', value: snapshot.rsi || '--', tone: snapshot.rsi > 65 ? 'green' : snapshot.rsi < 35 ? 'red' : 'cyan' },
    { label: 'Vol Shock', value: `${snapshot.volumeShock || 1}x`, tone: snapshot.volumeShock > 1.5 ? 'amber' : 'cyan' },
    { label: 'ATR', value: snapshot.atr || '--', tone: 'cyan' },
  ];

  return (
    <TerminalCard>
      <div className="radar-panel-head">
        <div>
          <p className="radar-eyebrow">Market Intelligence</p>
          <h3>Signal Engine</h3>
        </div>
        <Bolt size={17} className="text-cyan-300" />
      </div>
      <div className="radar-metric-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className={`radar-metric ${metric.tone}`}>
            <span>{metric.label}</span>
            <b>{metric.value}</b>
          </div>
        ))}
      </div>
      <div className="radar-mini-list">
        {(research?.indicators?.insights || []).slice(0, 5).map((item) => (
          <div key={`${item.type}-${item.detail}`} className="radar-insight-row">
            <span className={item.tone === 'bearish' ? 'radar-dot red' : 'radar-dot green'} />
            <div>
              <b>{item.type}</b>
              <small>{item.detail}</small>
            </div>
          </div>
        ))}
        {!research?.indicators?.insights?.length && scanners?.breakouts?.slice(0, 3).map((item) => (
          <div key={item.symbol} className="radar-insight-row">
            <span className="radar-dot green" />
            <div>
              <b>{item.symbol} breakout watch</b>
              <small>Trend strength {item.trendStrength}/100 with bullish bias.</small>
            </div>
          </div>
        ))}
      </div>
    </TerminalCard>
  );
};

const FnoPanel = ({ fno }) => (
  <TerminalCard>
    <div className="radar-panel-head">
      <div>
        <p className="radar-eyebrow">F&O Positioning</p>
        <h3>Options Intelligence</h3>
      </div>
      <Shield size={17} className="text-emerald-300" />
    </div>
    <div className="radar-fno-grid">
      <div><span>PCR</span><b>{fno?.pcr || '--'}</b></div>
      <div><span>Max Pain</span><b>{fno?.maxPain || '--'}</b></div>
      <div><span>IV Percentile</span><b>{fno?.ivPercentile || '--'}%</b></div>
      <div><span>Long Buildup</span><b>{fno?.longBuildup || '--'}%</b></div>
      <div><span>Short Cover</span><b>{fno?.shortCovering || '--'}%</b></div>
    </div>
    <div className="radar-oi-bars">
      {(fno?.oi || []).map((row) => {
        const total = Math.max(row.callOi, row.putOi, 1);
        return (
          <div key={row.strike} className="radar-oi-row">
            <span>{row.strike}</span>
            <div><i style={{ width: `${(row.putOi / total) * 100}%` }} /></div>
            <div><i style={{ width: `${(row.callOi / total) * 100}%` }} /></div>
          </div>
        );
      })}
    </div>
  </TerminalCard>
);

const NewsPanel = ({ news = [] }) => (
  <TerminalCard className="radar-news-panel">
    <div className="radar-panel-head">
      <div>
        <p className="radar-eyebrow">Flash News</p>
        <h3>Breaking Catalyst Feed</h3>
      </div>
      <Newspaper size={17} className="text-cyan-300" />
    </div>
    <div className="radar-news-list">
      {news.slice(0, 5).map((item) => (
        <a key={item.id} className="radar-news-card" href={item.url || undefined} target={item.url ? '_blank' : undefined} rel="noreferrer">
          <span className={`radar-sentiment ${item.sentiment}`}>{item.sentiment}</span>
          <b>{item.title}</b>
          <small>{item.source}</small>
        </a>
      ))}
    </div>
  </TerminalCard>
);

const ScannerStrip = ({ scanners }) => {
  const groups = [
    ['Gainers', scanners?.gainers || []],
    ['Losers', scanners?.losers || []],
    ['Volume Shockers', scanners?.volumeShockers || []],
    ['Breakouts', scanners?.breakouts || []],
  ];
  return (
    <div className="radar-scanner-strip">
      {groups.map(([label, rows]) => (
        <TerminalCard key={label}>
          <p className="radar-eyebrow">{label}</p>
          {rows.slice(0, 4).map((item) => (
            <div key={`${label}-${item.symbol}`} className="radar-scan-row">
              <span>{item.symbol}</span>
              <b className={Number(item.changePercent) >= 0 ? 'radar-green' : 'radar-red'}>{signed(item.changePercent)}%</b>
            </div>
          ))}
        </TerminalCard>
      ))}
    </div>
  );
};

const SectorPanel = ({ sectors = [] }) => (
  <TerminalCard>
    <div className="radar-panel-head">
      <div>
        <p className="radar-eyebrow">Sector Performance</p>
        <h3>Rotation Engine</h3>
      </div>
      <Activity size={17} className="text-cyan-300" />
    </div>
    <div className="radar-sector-grid">
      {sectors.slice(0, 8).map((sector) => (
        <div key={sector.sector} className={Number(sector.change) >= 0 ? 'up' : 'down'}>
          <b>{sector.sector}</b>
          <span>{signed(sector.change)}%</span>
          <small>Strength {sector.strength}</small>
        </div>
      ))}
    </div>
  </TerminalCard>
);

export default function RadarTerminalPage() {
  const {
    dashboard,
    symbolResearch,
    selectedSymbol,
    selectSymbol,
    isLoading,
    isConnected,
    ticks,
    market,
  } = useRadarTerminal('RELIANCE');

  if (isLoading && !dashboard) return <Skeleton />;

  const quote = symbolResearch?.quote || {};
  const changePositive = Number(quote.changePercent) >= 0;
  const badge = market?.badge || dashboard?.market?.badge || 'SYNCING';

  return (
    <main className="radar-terminal">
      <div className="radar-news-ticker">
        <span>FLASH</span>
        <div>
          {(dashboard?.news || []).map((item) => <b key={item.id}>{item.title}</b>)}
        </div>
      </div>

      <header className="radar-hero">
        <div>
          <p className="radar-eyebrow">RADAR Professional Trader Research Terminal</p>
          <h1>{selectedSymbol} <span>Rs {formatNumber(ticks[selectedSymbol]?.price ?? quote.price)}</span></h1>
          <div className="radar-hero-meta">
            <span className={changePositive ? 'radar-green' : 'radar-red'}>{signed(quote.change)} ({signed(quote.changePercent)}%)</span>
            <span>{quote.sector || 'NSE'}</span>
            <span>Source: {quote.source || 'hybrid'}</span>
          </div>
        </div>
        <div className="radar-status-cluster">
          <span className={`radar-market-badge ${badge.includes('CLOSED') ? 'closed' : 'live'}`}>
            <CircleDot size={13} />
            {badge}
          </span>
          <span className={isConnected ? 'radar-stream on' : 'radar-stream'}>
            <Radio size={14} />
            {isConnected ? 'Socket streaming' : 'Reconnecting'}
          </span>
          <span className="radar-stream">
            <Bell size={14} />
            News refresh 5m
          </span>
        </div>
      </header>

      <ScannerStrip scanners={dashboard?.scanners} />

      <section className="radar-grid">
        <div className="radar-main-column">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <RadarLightweightChart research={symbolResearch} />
          </motion.div>
          <SectorPanel sectors={dashboard?.sectors} />
        </div>

        <aside className="radar-side-column">
          <div className="radar-search">
            <Search size={15} />
            <input value={selectedSymbol} readOnly aria-label="Selected symbol" />
            <Zap size={15} className="text-cyan-300" />
          </div>
          <Watchlist rows={dashboard?.watchlist} ticks={ticks} selectedSymbol={selectedSymbol} onSelect={selectSymbol} />
          <IntelligencePanel research={symbolResearch} scanners={dashboard?.scanners} />
          <FnoPanel fno={symbolResearch?.fno || dashboard?.fno} />
          <NewsPanel news={dashboard?.news} />
        </aside>
      </section>
    </main>
  );
}
