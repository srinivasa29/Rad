
import axios from 'axios';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const STOCKS_ENDPOINT = `${API_BASE_URL}/stocks`;
const WATCHLIST_ENDPOINT = `${API_BASE_URL}/watchlist`;
const ALERTS_ENDPOINT = `${API_BASE_URL}/alerts`;



export const fetchStocks = async () => {
  try {
    const response = await axios.get(STOCKS_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};


export const fetchStockDetails = async (symbol) => {
  try {
    const response = await axios.get(`${STOCKS_ENDPOINT}/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stock ${symbol}:`, error);
    throw error;
  }
};


export const fetchOHLCData = async (symbol, interval = '1d', limit = 100) => {
  try {
    const response = await axios.get(`${STOCKS_ENDPOINT}/${symbol}/ohlc`, {
      params: { interval, limit },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching OHLC data for ${symbol}:`, error);
    throw error;
  }
};


export const subscribeToLivePrices = (symbols, onUpdate) => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsURL = `${wsProtocol}//${window.location.host}/api/ws/prices`;

  const ws = new WebSocket(wsURL);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: 'subscribe',
        symbols: symbols,
      })
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onUpdate(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
};



export const placeOrder = async (orderData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};


export const fetchOrderBook = async (symbol) => {
  try {
    const response = await axios.get(`${STOCKS_ENDPOINT}/${symbol}/orderbook`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order book for ${symbol}:`, error);
    throw error;
  }
};


export const fetchRecentTrades = async (symbol, limit = 50) => {
  try {
    const response = await axios.get(
      `${STOCKS_ENDPOINT}/${symbol}/trades`,
      { params: { limit } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching trades for ${symbol}:`, error);
    throw error;
  }
};



export const fetchUserWatchlist = async () => {
  try {
    const response = await axios.get(WATCHLIST_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
};


export const addToWatchlist = async (symbol) => {
  try {
    const response = await axios.post(WATCHLIST_ENDPOINT, { symbol });
    return response.data;
  } catch (error) {
    console.error(`Error adding ${symbol} to watchlist:`, error);
    throw error;
  }
};


export const removeFromWatchlist = async (symbol) => {
  try {
    const response = await axios.delete(`${WATCHLIST_ENDPOINT}/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing ${symbol} from watchlist:`, error);
    throw error;
  }
};



export const createAlert = async (alertData) => {
  try {
    const response = await axios.post(ALERTS_ENDPOINT, alertData);
    return response.data;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};


export const fetchAlerts = async () => {
  try {
    const response = await axios.get(ALERTS_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};


export const deleteAlert = async (alertId) => {
  try {
    const response = await axios.delete(`${ALERTS_ENDPOINT}/${alertId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting alert ${alertId}:`, error);
    throw error;
  }
};



export const fetchNewsForStock = async (symbol, limit = 20) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/news/${symbol}`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    throw error;
  }
};


export const fetchMarketNews = async (limit = 20) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/news`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching market news:', error);
    throw error;
  }
};



export const screenStocks = async (criteria) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/screener`, criteria);
    return response.data;
  } catch (error) {
    console.error('Error screening stocks:', error);
    throw error;
  }
};


export const fetchTopGainers = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/gainers`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top gainers:', error);
    throw error;
  }
};


export const fetchTopLosers = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/losers`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top losers:', error);
    throw error;
  }
};


export const fetchHighVolumeStocks = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/high-volume`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching high volume stocks:', error);
    throw error;
  }
};




export default {
  fetchStocks,
  fetchStockDetails,
  fetchOHLCData,
  subscribeToLivePrices,

  placeOrder,
  fetchOrderBook,
  fetchRecentTrades,

  fetchUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,

  createAlert,
  fetchAlerts,
  deleteAlert,

  fetchNewsForStock,
  fetchMarketNews,

  screenStocks,
  fetchTopGainers,
  fetchTopLosers,
  fetchHighVolumeStocks,
};
