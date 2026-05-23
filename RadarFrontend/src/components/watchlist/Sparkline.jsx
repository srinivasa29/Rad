import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const pathFromSeries = (series = [], width = 118, height = 38) => {
  if (!Array.isArray(series) || series.length < 2) return { line: '', area: '' };
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series.map((value, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x: x.toFixed(2), y: y.toFixed(2) };
  });
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const area = `${line} L ${width},${height} L 0,${height} Z`;
  return { line, area };
};

const Sparkline = ({ series = [], positive = true }) => {
  const { line, area } = useMemo(() => pathFromSeries(series), [series]);
  const color = positive ? '#34d399' : '#fb7185';
  const id = `spark-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <motion.svg viewBox="0 0 118 38" className="h-[38px] w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <defs>
        <linearGradient id={`${id}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}-fill)`} />
      <path d={line} fill="none" stroke={`url(#${id}-line)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
};

export default Sparkline;
