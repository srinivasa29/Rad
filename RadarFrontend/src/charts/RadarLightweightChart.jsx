import { useEffect, useMemo, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const toSeriesData = (candles = []) => candles
  .map((item) => ({
    time: Number(item.time),
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
  }))
  .filter((item) => item.time && Number.isFinite(item.close))
  .sort((a, b) => a.time - b.time);

const toVolumeData = (candles = []) => candles
  .map((item) => ({
    time: Number(item.time),
    value: Number(item.volume || 0),
    color: Number(item.close) >= Number(item.open) ? 'rgba(34,197,94,0.34)' : 'rgba(248,81,73,0.34)',
  }))
  .filter((item) => item.time);

const RadarLightweightChart = ({ research, height = 520 }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});

  const candles = useMemo(() => toSeriesData(research?.candles), [research?.candles]);
  const volumes = useMemo(() => toVolumeData(research?.candles), [research?.candles]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const chart = createChart(containerRef.current, {
      height,
      width: containerRef.current.clientWidth,
      autoSize: true,
      layout: {
        background: { color: '#050b16' },
        textColor: '#9fb3c8',
        fontFamily: 'Inter, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(51,65,85,0.45)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(51,65,85,0.45)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#22d3ee', labelBackgroundColor: '#0891b2' },
        horzLine: { color: '#22d3ee', labelBackgroundColor: '#0891b2' },
      },
      rightPriceScale: { borderColor: 'rgba(148,163,184,0.18)', scaleMargins: { top: 0.08, bottom: 0.24 } },
      timeScale: { borderColor: 'rgba(148,163,184,0.18)', timeVisible: true, secondsVisible: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#f85149',
      wickUpColor: '#22c55e',
      wickDownColor: '#f85149',
      borderVisible: false,
    });
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });

    const ema20 = chart.addLineSeries({ color: '#22d3ee', lineWidth: 2, title: 'EMA 20' });
    const ema50 = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, title: 'EMA 50' });

    chartRef.current = chart;
    seriesRef.current = { candleSeries, volumeSeries, ema20, ema50 };
    const resize = () => chart.applyOptions({ width: containerRef.current?.clientWidth || 900 });
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current.candleSeries || !candles.length) return;
    seriesRef.current.candleSeries.setData(candles);
    seriesRef.current.volumeSeries.setData(volumes);
    seriesRef.current.ema20.setData(research?.indicators?.overlays?.ema20 || []);
    seriesRef.current.ema50.setData(research?.indicators?.overlays?.ema50 || []);
    chartRef.current?.timeScale().fitContent();
  }, [candles, volumes, research?.indicators]);

  return (
    <div className="radar-chart-shell">
      <div className="radar-chart-toolbar">
        <div>
          <p className="radar-eyebrow">Live Research Chart</p>
          <h2>{research?.symbol || 'RADAR'} Candlestick Workspace</h2>
        </div>
        <div className="radar-indicator-strip">
          <span>EMA 20</span>
          <span>EMA 50</span>
          <span>RSI</span>
          <span>MACD</span>
          <span>VOL</span>
        </div>
      </div>
      <div ref={containerRef} className="radar-chart-canvas" style={{ minHeight: height }} />
    </div>
  );
};

export default RadarLightweightChart;
