import React, { useEffect, useRef } from 'react';
import { createChart, HistogramSeries } from 'lightweight-charts';

export default function VolumeChart({ data, width, height, onRangeChange, chartRef }) {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: width || containerRef.current.clientWidth,
      height: height || 100,
      autoSize: true,
      layout: {
        background: { color: '#050816' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      timeScale: {
        visible: false, // Synced with main timescale
        borderVisible: false,
        barSpacing: 12,
        rightOffset: 8,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      crosshair: {
        mode: 1, // Magnet
      },
    });

    // Create volume histogram series (v5 syntax)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#00ff9d',
      priceFormat: {
        type: 'volume',
      },
    });

    const histData = data.map(d => ({
      time: d.time,
      value: d.value,
      color: d.isUp ? 'rgba(0, 255, 157, 0.5)' : 'rgba(255, 77, 109, 0.5)',
    }));
    volumeSeries.setData(histData);

    chart.timeScale().fitContent();

    if (chartRef) {
      chartRef.current = chart;
    }

    if (onRangeChange) {
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        onRangeChange(range, chart);
      });
    }

    // Responsive scaling
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0]) return;
      const { width } = entries[0].contentRect;
      chart.resize(width, height || 100);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, width, height, chartRef]);

  const latestVal = data && data.length > 0 ? data[data.length - 1]?.value : 0;

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-3 z-10 text-[9px] font-black font-mono text-[#7c8db5] flex items-center gap-2">
        <span className="text-[#00ff9d]">Volume</span>
        <span className="text-slate-300 font-bold">{(latestVal / 1e6).toFixed(2)}M</span>
      </div>
      <div className="w-full h-full" ref={containerRef} />
    </div>
  );
}
