import { useState, useEffect, useCallback } from 'react';



const MOCK_NEWS_DATA = {
  RELIANCE: { count: 5, sentiment: 65, hasToday: true, unread: 3 },
  HDFCBANK: { count: 2, sentiment: 45, hasToday: false, unread: 1 },
  INFY: { count: 8, sentiment: 72, hasToday: true, unread: 5 },
  TCS: { count: 3, sentiment: -15, hasToday: true, unread: 2 },
  ICICIBANK: { count: 6, sentiment: 58, hasToday: true, unread: 4 },
  SBIN: { count: 1, sentiment: 0, hasToday: false, unread: 0 },
};

export const useWatchlistEnhancements = (stocks = []) => {
  const [newsData, setNewsData] = useState(MOCK_NEWS_DATA);
  const [readArticles, setReadArticles] = useState(new Set());
  const [viewMode, setViewMode] = useState('expanded'); // 'compact' | 'expanded'
  const [showOnlyWithNews, setShowOnlyWithNews] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const savedReadArticles = localStorage.getItem('watchlist_read_articles');
    if (savedReadArticles) {
      try {
        setReadArticles(new Set(JSON.parse(savedReadArticles)));
      } catch (e) {
        console.error('Failed to load read articles:', e);
      }
    }

    const savedViewMode = localStorage.getItem('watchlist_view_mode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  const markArticleAsRead = useCallback((articleId) => {
    setReadArticles((prev) => {
      const next = new Set(prev);
      next.add(articleId);
      localStorage.setItem('watchlist_read_articles', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === 'compact' ? 'expanded' : 'compact';
      localStorage.setItem('watchlist_view_mode', next);
      return next;
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setNotificationsEnabled(enabled);
      return enabled;
    }

    return false;
  }, []);

  const sendNotification = useCallback((title, options = {}) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error('Failed to send notification:', e);
    }
  }, [notificationsEnabled]);

  const exportToCSV = useCallback((stocks, newsData) => {
    if (!stocks || stocks.length === 0) {
      alert('No stocks to export');
      return;
    }

    const headers = [
      'Symbol',
      'Name',
      'Price',
      'Change',
      '% Change',
      'Volume',
      'Market Cap',
      'RSI',
      'MACD',
      '52W High',
      '52W Low',
      'VWAP',
      'News Count',
      'Sentiment Score',
      'Has News Today',
    ];

    const rows = stocks.map((stock) => {
      const news = newsData[stock.symbol] || {};
      return [
        stock.symbol,
        stock.name,
        stock.price,
        stock.change,
        stock.percent,
        stock.volume,
        stock.marketCap,
        stock.rsi,
        stock.macd,
        stock.high52w,
        stock.low52w,
        stock.vwap,
        news.count || 0,
        news.sentiment || 0,
        news.hasToday ? 'Yes' : 'No',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `watchlist_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const getNewsInfo = useCallback((symbol) => {
    return newsData[symbol] || { count: 0, sentiment: 0, hasToday: false, unread: 0 };
  }, [newsData]);

  const getUnreadCount = useCallback((symbol) => {
    const news = newsData[symbol];
    return news?.unread || 0;
  }, [newsData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNewsData((prev) => {
        const symbols = Object.keys(prev);
        if (symbols.length === 0) return prev;
        
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const current = prev[randomSymbol];
        
        if (Math.random() > 0.9) {
          const newData = {
            ...prev,
            [randomSymbol]: {
              ...current,
              count: (current?.count || 0) + 1,
              unread: (current?.unread || 0) + 1,
              hasToday: true,
            },
          };

          if (notificationsEnabled) {
            sendNotification(`Breaking News: ${randomSymbol}`, {
              body: 'New market-moving news detected',
              tag: randomSymbol,
            });
          }

          return newData;
        }
        
        return prev;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [notificationsEnabled, sendNotification]);

  return {
    newsData,
    getNewsInfo,
    getUnreadCount,
    readArticles,
    markArticleAsRead,
    viewMode,
    toggleViewMode,
    showOnlyWithNews,
    setShowOnlyWithNews,
    notificationsEnabled,
    requestNotificationPermission,
    sendNotification,
    exportToCSV,
  };
};

export default useWatchlistEnhancements;
