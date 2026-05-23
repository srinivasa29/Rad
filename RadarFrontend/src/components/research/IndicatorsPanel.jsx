import React, { useEffect, useState } from 'react';
import api from '../../api/api';

const Pill = ({ children, bg='bg-gray-800', color='text-gray-200' }) => (
  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${bg} ${color} mr-2`}>{children}</span>
);

export default function IndicatorsPanel() {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/research/indicators');
      setSignals(Array.isArray(res.data) ? res.data : (res.data?.signals || []));
    } catch (err) {
      setSignals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div className="rounded-lg p-3 bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Indicators</h4>
        <div className="text-xs text-gray-400">RSI · MACD · VWAP · EMA20/50 · RVOL</div>
      </div>

      {loading && <div className="animate-pulse space-y-2"><div className="h-6 bg-[rgba(255,255,255,0.03)] rounded" /><div className="h-6 bg-[rgba(255,255,255,0.03)] rounded" /></div>}

      {!loading && signals.length === 0 && <div className="text-sm text-gray-400">Data unavailable</div>}

      {!loading && signals.length > 0 && (
        <div className="grid grid-cols-12 gap-2 text-xs">
          {signals.slice(0,8).map((s, i) => (
            <div key={i} className="col-span-6 md:col-span-4 p-2 bg-[rgba(0,0,0,0.18)] rounded">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{s.symbol}</div>
                <div className="text-xs text-gray-300">{s.value}</div>
              </div>
              <div className="mt-2 flex items-center">
                {s.value?.toLowerCase().includes('oversold') && <Pill bg='bg-yellow-800' color='text-yellow-200'>Oversold</Pill>}
                {s.value?.toLowerCase().includes('overbought') && <Pill bg='bg-red-800' color='text-red-200'>Overbought</Pill>}
                {s.value?.toLowerCase().includes('macd') && <Pill bg='bg-green-800' color='text-green-200'>Bullish MACD</Pill>}
                {s.value?.toLowerCase().includes('volume') && <Pill bg='bg-indigo-800' color='text-indigo-200'>High Volume</Pill>}
                {!s.value && <Pill>Data unavailable</Pill>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
