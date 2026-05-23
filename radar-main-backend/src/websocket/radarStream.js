const marketHoursService = require('../services/marketHoursService');
const radarAggregationService = require('../services/radarAggregationService');
const { normalizeRadarSymbol, nextTickFromCandle } = require('../utils/radarMockMarket');

let intervalId = null;
const subscriptions = new Map();

const getSocketSymbols = (socket) => subscriptions.get(socket.id) || radarAggregationService.DEFAULT_SYMBOLS.slice(0, 8);

const initRadarStream = (io) => {
  io.on('connection', (socket) => {
    socket.on('radar:subscribe', (payload = {}) => {
      const symbols = Array.isArray(payload.symbols) && payload.symbols.length
        ? payload.symbols.map(normalizeRadarSymbol).filter(Boolean).slice(0, 25)
        : radarAggregationService.DEFAULT_SYMBOLS.slice(0, 10);
      subscriptions.set(socket.id, symbols);
      socket.join('radar');
      socket.emit('radar:status', {
        subscribed: symbols,
        market: marketHoursService.getMarketStatus(),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      subscriptions.delete(socket.id);
    });
  });

  if (intervalId) return;
  intervalId = setInterval(async () => {
    const market = marketHoursService.getMarketStatus();
    const sockets = await io.in('radar').fetchSockets();
    await Promise.all(sockets.map(async (socket) => {
      const symbols = getSocketSymbols(socket);
      const payload = await Promise.all(symbols.map(async (symbol, index) => {
        const research = await radarAggregationService.buildSymbolResearch(symbol, '5m');
        const last = research.candles.at(-1);
        const tick = market.isOpen
          ? { ...last, symbol: research.symbol, simulated: research.quote.source !== 'twelvedata' }
          : nextTickFromCandle(research.symbol, last, index);
        return {
          symbol: research.symbol,
          price: tick.close,
          change: research.quote.change,
          changePercent: research.quote.changePercent,
          candle: tick,
          quote: research.quote,
          indicators: research.indicators.snapshot,
          marketMode: market.isOpen ? 'LIVE' : 'CLOSED_REPLAY',
        };
      }));
      socket.emit('radar:tick', {
        market: {
          ...market,
          badge: market.isOpen ? 'MARKET LIVE' : 'MARKET CLOSED',
          mode: market.isOpen ? 'LIVE' : 'CLOSED_REPLAY',
        },
        ticks: payload,
        timestamp: new Date().toISOString(),
      });
    }));
  }, 3000);
};

module.exports = { initRadarStream };
