import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/api';

export default function WatchlistScansPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const timer = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/research/watchlist-scans');
      setData(res.data?.results || []);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    load();
    timer.current = setInterval(load, 60000);
    return () => clearInterval(timer.current);
  }, []);

  return (
    <div className="rounded-lg p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Watchlist Scans</h4>
        <div className="text-xs text-gray-400">Auto refresh · 60s</div>
      </div>

      {loading && <div className="animate-pulse space-y-2"><div className="h-6 bg-[rgba(255,255,255,0.03)] rounded" /><div className="h-6 bg-[rgba(255,255,255,0.03)] rounded" /></div>}

      {!loading && data.length === 0 && <div className="text-sm text-gray-400">Data unavailable</div>}

      {!loading && data.length > 0 && (
        <div className="space-y-2 text-xs">
          {data.slice(0,8).map((d,i)=> (
            <div key={i} className="flex items-center justify-between p-2 bg-[rgba(0,0,0,0.18)] rounded">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{d.symbol}</div>
                <div className="text-gray-300 text-[11px] truncate max-w-[260px]">{(d.signals||[]).slice(0,3).join(' · ') || 'No signal'}</div>
              </div>
              <div className="text-right text-[11px] text-gray-400 ml-4">{d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : 'Data unavailable'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
