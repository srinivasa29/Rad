import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';

export default function MACDChart({ data, width, height, onRangeChange, chartRef }) {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current || !data) return;
    const { macdLine, signalLine, histogram } = data;
    if (!macdLine || macdLine.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: width || containerRef.current.clientWidth,
      height: height || 150,
      layout: {
        background: { color: '#050816' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      timeScale: {
        visible: true, // Show timescale on bottom panel
        borderVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        barSpacing: 8,
        rightOffset: 0,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      crosshair: {
        mode: 1, // Magnet
      },
    });

    // v5 unified Series API: chart.addSeries(LineSeries/HistogramSeries, options)
    const mLineSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1.5,
      priceLineVisible: false,
    });
    const sLineSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1.5,
      priceLineVisible: false,
    });
    const hSeries = chart.addSeries(HistogramSeries, {
      color: '#ff007a',
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    mLineSeries.setData(macdLine);
    sLineSeries.setData(signalLine);

    // Format histogram colors based on positive/negative
    const histData = histogram.map(h => ({
      time: h.time,
      value: h.value,
      color: h.value >= 0 ? 'rgba(0, 255, 157, 0.5)' : 'rgba(255, 77, 109, 0.5)',
    }));
    hSeries.setData(histData);

    chart.timeScale().fitContent();

    if (chartRef) {
      chartRef.current = chart;
    }

    if (onRangeChange) {
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        onRangeChange(range, chart);
      });
    }

    const handleResize = () => {
      chart.resize(containerRef.current.clientWidth, height || 150);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, width, height, chartRef]);

  const latestMacd = data?.macdLine?.[data.macdLine.length - 1]?.value;
  const latestSignal = data?.signalLine?.[data.signalLine.length - 1]?.value;
  const latestHist = data?.histogram?.[data.histogram.length - 1]?.value;

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-3 z-10 text-[9px] font-black font-mono text-[#7c8aa5] flex items-center gap-2">
        <span>MACD (12, 26, 9)</span>
        <span className="text-[#f59e0b]">MACD: <span className="font-bold">{latestMacd?.toFixed(1) || '—'}</span></span>
        <span className="text-[#3b82f6]">SIG: <span className="font-bold">{latestSignal?.toFixed(1) || '—'}</span></span>
        <span className={latestHist >= 0 ? 'text-[#00ff9d]' : 'text-[#ff4d6d]'}>HIST: <span className="font-bold">{latestHist?.toFixed(1) || '—'}</span></span>
      </div>
      <div className="w-full h-full" ref={containerRef} />
    </div>
  );
}
