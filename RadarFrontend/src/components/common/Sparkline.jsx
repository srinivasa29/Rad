import React from 'react';

const Sparkline = ({ data = [] }) => {
  // Simple SVG sparkline — small, fast and dependency-free
  const width = 120, height = 32, padding = 4;
  if (!data || data.length === 0) {
    return <div className="w-28 h-8 bg-[rgba(255,255,255,0.02)] rounded" />;
  }
  const min = Math.min(...data), max = Math.max(...data);
  const points = data.map((d,i) => {
    const x = padding + (i/(data.length-1))*(width-2*padding);
    const y = padding + (1 - ((d - min) / (max - min || 1))) * (height-2*padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="rounded">
      <polyline points={points} fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Sparkline;
