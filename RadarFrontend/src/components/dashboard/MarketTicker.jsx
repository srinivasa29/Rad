import { useState, useEffect } from 'react';
import './MarketTicker.css';
import { fetchMarketData } from '../../api/marketApi';

const displaySymbol = (value) => String(value || '').replace(/\.(NS|BO)$/i, '');

const MarketTicker = () => {
  const [isHovered, setIsHovered] = useState(false);

  const [stocks, setStocks] = useState([
    { symbol: 'HDFCBANK', price: '1,650', change: 0.48 },
    { symbol: 'INFY', price: '1,420', change: -0.21 },
    { symbol: 'TCS', price: '3,845', change: 0.92 },
    { symbol: 'NIFTY 50', price: '18,500', change: 0.52 },
    { symbol: 'BANKNIFTY', price: '44,200', change: 0.35 },
  ]);

  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError(false);
        const res = await fetchMarketData({ type: 'STOCK', sort: 'gainers' });
        if (res && res.length > 0) {
          const mapped = res
            .slice(0, 8)
            .map((item) => {
              const price = Number(item.price || 0);
              const change = Number(item.change_24h ?? item.change ?? 0);
              return {
                symbol: displaySymbol(item.symbol || item.name).substring(0, 10),
                price: Number.isFinite(price) ? price.toLocaleString() : '0',
                change: Number.isFinite(change) ? change : 0,
              };
            });

          if (mapped.length > 0) {
            setStocks(mapped);
          }
        }
      } catch (err) {
          console.error("Ticker fetch failed:", err);
          setError(true);
      }
    }
    load();
  }, []);
  const duplicated = [...stocks, ...stocks];

  return (
    <div
      className="market-ticker-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`ticker-wrapper-track ${isHovered || error ? 'paused' : ''}`}>
        {error && (
            <div className="ticker-item-simple text-rose-500 font-bold px-4">
                ⚠ Market Feed Offline
            </div>
        )}
        {duplicated.map((s, idx) => (
          <div className="ticker-item-simple" key={idx}>
            <span className="ticker-sym">{s.symbol}</span>
            <span className="ticker-val">{s.price}</span>
            <span className={`ticker-chg ${s.change >= 0 ? 'up' : 'down'}`}>
              {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
