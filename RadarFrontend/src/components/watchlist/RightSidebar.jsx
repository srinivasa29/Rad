import React from 'react';
import { motion } from 'framer-motion';

const Panel = ({ title, children }) => (
  <div className="bg-[rgba(255,255,255,0.02)] rounded-lg p-4 mb-4">
    <div className="text-xs text-gray-300 mb-2">{title}</div>
    <div>{children}</div>
  </div>
);

const RightSidebar = ({ items = [] }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Panel title="Technical Snapshot">
        {items[0] ? (
          <div>
            <div className="font-semibold">{items[0].symbol}</div>
            <div className="text-sm text-gray-300">{items[0].price?.toFixed(2) || '—'}</div>
            <ul className="mt-2 text-xs text-gray-300">
              <li>RSI: {items[0].rsi?.toFixed(1) || '—'}</li>
              <li>EMA20 / EMA50: {(items[0].ema20||'—') + ' / ' + (items[0].ema50||'—')}</li>
              <li>Volume: {items[0].volume ? Number(items[0].volume).toLocaleString() : '—'}</li>
            </ul>
          </div>
        ) : <div className="text-gray-500">No snapshot</div>}
      </Panel>

      <Panel title="Recent News">
        <div className="text-sm text-gray-300">Use the Research button to open news and summary.</div>
      </Panel>

      <Panel title="Market Bias">
        <div className="text-cyan-200">Neutral</div>
      </Panel>
    </motion.div>
  );
};

export default RightSidebar;
