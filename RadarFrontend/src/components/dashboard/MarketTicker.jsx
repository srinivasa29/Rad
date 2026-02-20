import React, { useState } from 'react';
import './MarketTicker.css';

const MarketTicker = () => {
  const [isHovered, setIsHovered] = useState(false);

  const stocks = [
    { symbol: 'HDFCBANK', price: '1,650', change: 0.48 },
    { symbol: 'INFY', price: '1,420', change: -0.21 },
    { symbol: 'TCS', price: '3,845', change: 0.92 },
    { symbol: 'WIPRO', price: '348', change: -0.55 },
    { symbol: 'TATAMOTORS', price: '452', change: 2.45 },
    { symbol: 'RELIANCE', price: '2,550', change: 0.72 },
    { symbol: 'NIFTY 50', price: '18,500', change: 0.52 },
    { symbol: 'BANKNIFTY', price: '44,200', change: 0.35 },
  ];

  // duplicate items for seamless continuous scroll
  const duplicated = [...stocks, ...stocks];

  return (
    <div
      className="market-ticker-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`ticker-wrapper-track ${isHovered ? 'paused' : ''}`}>
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
