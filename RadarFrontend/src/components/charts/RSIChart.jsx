import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';

export default function RSIChart({ data, width, height, onRangeChange, chartRef }) {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

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
        visible: false, // Hide timescale, synced with main chart
        borderVisible: false,
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

    // v5 unified Series API: chart.addSeries(LineSeries, options)
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1.5,
      priceFormat: {
        type: 'price',
        precision: 1,
        minMove: 0.1,
      },
      autoscaleInfoProvider: () => ({
        priceRange: {
          min: 0,
          max: 100,
        },
      }),
    });

    // Add baseline support/overbought indicators (30, 70)
    const upperLimit = chart.addSeries(LineSeries, {
      color: 'rgba(255, 77, 109, 0.25)',
      lineWidth: 1,
      lineStyle: 3, // Dashed
      lastValueVisible: false,
      priceLineVisible: false,
      autoscaleInfoProvider: () => ({
        priceRange: {
          min: 0,
          max: 100,
        },
      }),
    });
    const lowerLimit = chart.addSeries(LineSeries, {
      color: 'rgba(0, 255, 157, 0.25)',
      lineWidth: 1,
      lineStyle: 3, // Dashed
      lastValueVisible: false,
      priceLineVisible: false,
      autoscaleInfoProvider: () => ({
        priceRange: {
          min: 0,
          max: 100,
        },
      }),
    });

    const rsiData = data.map(d => ({ time: d.time, value: d.value }));
    rsiSeries.setData(rsiData);
    
    // Fill limits
    const limit70 = data.map(d => ({ time: d.time, value: 70 }));
    const limit30 = data.map(d => ({ time: d.time, value: 30 }));
    upperLimit.setData(limit70);
    lowerLimit.setData(limit30);

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

  const latestVal = data && data.length > 0 ? data[data.length - 1]?.value : null;

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-3 z-10 text-[9px] font-black font-mono text-[#7c8aa5] flex items-center gap-2">
        <span className="text-[#a855f7]">RSI (14)</span>
        {latestVal !== null && (
          <span className="text-slate-300 font-bold">{Number(latestVal).toFixed(1)}</span>
        )}
      </div>
      <div className="w-full h-full" ref={containerRef} />
    </div>
  );
}
