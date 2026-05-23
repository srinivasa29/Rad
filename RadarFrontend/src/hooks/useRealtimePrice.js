import { useRealtimeQuote } from './useRealtimeQuote';

export function useRealtimePrice(symbol, options = {}) {
  const {
    quote,
    loading,
    error,
    refetch,
    isStale,
    price,
    change,
    changePercent,
    volume
  } = useRealtimeQuote(symbol, {
    autoFetch: true,
    refreshInterval: 15000, // Fast ticking interval for real-time feel
    ...options
  });

  return {
    price,
    change,
    changePercent,
    volume,
    loading,
    error,
    refetch,
    isStale,
    rawQuote: quote
  };
}
export default useRealtimePrice;
