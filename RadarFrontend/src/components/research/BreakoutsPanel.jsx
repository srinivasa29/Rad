import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import Sparkline from '../watchlist/Sparkline';

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center justify-between h-10 bg-[rgba(255,255,255,0.02)] rounded px-2" />
);

export default function BreakoutsPanel() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/research/breakouts');
      setItems(Array.isArray(res.data) ? res.data : (res.data?.alerts || []));
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div className="rounded-lg p-3 bg-gradient-to-r from-[#071027] to-[rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">Breakouts</h4>
        <div className="text-xs text-gray-400">Live · Real data</div>
      </div>

      <div className="space-y-2">
        {loading && <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}
        {!loading && items.length === 0 && <div className="text-sm text-gray-400">Data unavailable</div>}

        {!loading && items.length > 0 && items.slice(0,8).map((it, i) => {
          const bullish = /breakout|resistance|52-week|ema/i.test(it.type || it.typeName || '');
          const strength = it.strengthPercent || (it.price ? Math.abs(it.price).toFixed(2) : null);
          return (
            <div key={i} className={`flex items-center justify-between p-2 rounded ${bullish ? 'bg-[rgba(52,211,153,0.04)]' : 'bg-[rgba(255,255,255,0.01)]'}`} style={bullish ? { boxShadow: '0 6px 18px rgba(52,211,153,0.06)' } : {}}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 text-sm font-semibold ${bullish ? 'text-green-300' : 'text-gray-200'}`}>{it.symbol || it.symbol}</div>
                <div className="text-[12px] text-gray-300 truncate max-w-[220px]">{it.type || it.typeName || 'Breakout'}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-right text-gray-200 w-20">{strength ? `${strength}%` : 'Data unavailable'}</div>
                <div className="text-xs text-gray-300 w-20 text-right">{it.volumeConfirmed ? 'Vol ✓' : (it.volumeConfirmed === false ? 'Vol ✕' : 'Data unavailable')}</div>
                <div className="w-24 hidden sm:block"><Sparkline series={it.spark || it.series || []} positive={bullish} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
