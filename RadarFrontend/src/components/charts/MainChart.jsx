import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';

export default function MainChart({
  candles,
  indicators,
  compareAsset,
  activeIndicators,
  onRangeChange,
  chartRef,
  setHoverData,
  symbol,
  height,
}) {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current || !candles || candles.length === 0) return;

    // Clear previous chart nodes
    containerRef.current.innerHTML = '';

    const chartHeight = height || containerRef.current.clientHeight || 400;
    const chartWidth = containerRef.current.clientWidth || 800;

    const chart = createChart(containerRef.current, {
      width: chartWidth,
      height: chartHeight,
      autoSize: true,
      layout: {
        background: { color: '#050816' },
        textColor: '#94a3b8',
        fontSize: 10,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.05)',
      },
      leftPriceScale: {
        visible: !!compareAsset,
        borderVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.05)',
      },
      timeScale: {
        borderVisible: false,
        visible: !activeIndicators.includes('MACD') && !activeIndicators.includes('RSI'), // Show timescale only on bottom panel
        barSpacing: 8,
        rightOffset: 0,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        mode: 1, // Magnet
      },
    });

    // Candlesticks Series (v5 syntax)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9d',
      downColor: '#ff4d6d',
      borderUpColor: '#00ff9d',
      borderDownColor: '#ff4d6d',
      wickUpColor: '#00ff9d',
      wickDownColor: '#ff4d6d',
    });
    candleSeries.setData(candles);

    // Volume overlay
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay style
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const volumeData = candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 77, 109, 0.15)',
    }));
    volumeSeries.setData(volumeData);

    // EMAs & VWAP
    let ema20Series = null;
    let ema50Series = null;
    let vwapSeries = null;
    let basisSeries = null;
    let upperSeries = null;
    let lowerSeries = null;

    if (activeIndicators.includes('EMA 20') && indicators?.ema20?.length > 0) {
      ema20Series = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1.5,
        title: 'EMA 20',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      ema20Series.setData(indicators.ema20);
    }

    if (activeIndicators.includes('EMA 50') && indicators?.ema50?.length > 0) {
      ema50Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1.5,
        title: 'EMA 50',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      ema50Series.setData(indicators.ema50);
    }

    if (activeIndicators.includes('VWAP') && indicators?.vwap?.length > 0) {
      vwapSeries = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'VWAP',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      vwapSeries.setData(indicators.vwap);
    }

    if (activeIndicators.includes('Bollinger Bands') && indicators?.bb?.basis?.length > 0) {
      basisSeries = chart.addSeries(LineSeries, {
        color: 'rgba(244, 63, 94, 0.4)',
        lineWidth: 1,
        title: 'BB Basis',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      basisSeries.setData(indicators.bb.basis);

      upperSeries = chart.addSeries(LineSeries, {
        color: 'rgba(59, 130, 246, 0.4)',
        lineWidth: 1,
        title: 'BB Upper',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      upperSeries.setData(indicators.bb.upper);

      lowerSeries = chart.addSeries(LineSeries, {
        color: 'rgba(59, 130, 246, 0.4)',
        lineWidth: 1,
        title: 'BB Lower',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      lowerSeries.setData(indicators.bb.lower);
    }

    // Comparison Overlay (Yellow line on left scale)
    if (compareAsset) {
      const compSeries = chart.addSeries(LineSeries, {
        color: '#f7b500',
        lineWidth: 1.5,
        priceScaleId: 'left',
        title: compareAsset,
        lastValueVisible: false,
        priceLineVisible: false,
      });

      const compareCloses = candles.map((c, idx) => {
        const offset = Math.sin(idx * 0.12 + (compareAsset.charCodeAt(0) * 0.4)) * 0.06;
        return {
          time: c.time,
          value: c.close * (1 + offset),
        };
      });
      compSeries.setData(compareCloses);
    }

    // Set layout zoom behavior
    chart.timeScale().fitContent();

    if (chartRef) {
      chartRef.current = chart;
    }

    // Track crosshair motion for OHLC overlay
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time) {
        setHoverData(null);
        return;
      }
      
      const price = param.seriesData.get(candleSeries);
      const vol = param.seriesData.get(volumeSeries);
      const ema20Val = ema20Series ? param.seriesData.get(ema20Series)?.value : null;
      const ema50Val = ema50Series ? param.seriesData.get(ema50Series)?.value : null;
      const vwapVal = vwapSeries ? param.seriesData.get(vwapSeries)?.value : null;
      
      if (price) {
        setHoverData({
          time: param.time,
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: vol ? vol.value : 0,
          ema20: ema20Val,
          ema50: ema50Val,
          vwap: vwapVal,
        });
      }
    });

    if (onRangeChange) {
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        onRangeChange(range, chart);
      });
    }

    // Responsive scaling using ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0]) return;
      const { width, height } = entries[0].contentRect;
      chart.resize(width, height || chartHeight);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, indicators, compareAsset, activeIndicators, height]);

  return <div className="w-full h-full" ref={containerRef} />;
}
