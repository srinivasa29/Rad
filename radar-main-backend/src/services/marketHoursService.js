

const logger = require('../utils/logger');

class MarketHoursService {
  constructor() {
    this.nseHours = {
      timezone: 'Asia/Kolkata',
      open: { hour: 9, minute: 15 },   // 9:15 AM IST
      close: { hour: 15, minute: 30 },  // 3:30 PM IST
      preMarket: { hour: 9, minute: 0 },
      postMarket: { hour: 16, minute: 0 },
    };

    this.holidays2024 = [
      '2024-01-26', // Republic Day
      '2024-03-08', // Mahashivratri
      '2024-03-25', // Holi
      '2024-03-29', // Good Friday
      '2024-04-11', // Id-Ul-Fitr
      '2024-04-17', // Ram Navami
      '2024-04-21', // Mahavir Jayanti
      '2024-05-01', // Maharashtra Day
      '2024-05-23', // Buddha Purnima
      '2024-06-17', // Bakri Id
      '2024-07-17', // Muharram
      '2024-08-15', // Independence Day
      '2024-08-26', // Janmashtami
      '2024-10-02', // Gandhi Jayanti
      '2024-10-12', // Dussehra
      '2024-10-31', // Diwali (Laxmi Pujan)
      '2024-11-01', // Diwali (Balipratipada)
      '2024-11-15', // Gurunanak Jayanti
      '2024-12-25', // Christmas
    ];

    this.holidays2026 = [
      '2026-01-26', // Republic Day
      '2026-02-16', // Mahashivratri
      '2026-03-14', // Holi
      '2026-04-03', // Good Friday
      '2026-04-21', // Ram Navami
      '2026-05-01', // Maharashtra Day
      '2026-08-15', // Independence Day
      '2026-10-02', // Gandhi Jayanti
      '2026-10-22', // Dussehra
      '2026-11-10', // Diwali
      '2026-12-25', // Christmas
    ];
  }

  
  isNSEOpen() {
    const now = new Date();
    const istTime = this.toIST(now);
    
    if (this.isWeekend(istTime)) {
      return false;
    }

    if (this.isHoliday(istTime)) {
      return false;
    }

    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const openTime = this.nseHours.open.hour * 60 + this.nseHours.open.minute;
    const closeTime = this.nseHours.close.hour * 60 + this.nseHours.close.minute;

    return currentTime >= openTime && currentTime <= closeTime;
  }

  
  shouldFetchUpdates() {
    const now = new Date();
    const istTime = this.toIST(now);
    
    if (this.isWeekend(istTime)) {
      return false;
    }

    if (this.isHoliday(istTime)) {
      return false;
    }

    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const openTime = this.nseHours.preMarket.hour * 60 + this.nseHours.preMarket.minute;
    const closeTime = this.nseHours.postMarket.hour * 60 + this.nseHours.postMarket.minute;

    return currentTime >= openTime && currentTime <= closeTime;
  }

  
  getMarketStatus() {
    const now = new Date();
    const istTime = this.toIST(now);
    const isOpen = this.isNSEOpen();
    const shouldFetch = this.shouldFetchUpdates();

    return {
      isOpen,
      shouldFetchUpdates: shouldFetch,
      currentTime: istTime.toISOString(),
      timezone: 'Asia/Kolkata',
      nextOpen: this.getNextOpenTime(istTime),
      nextClose: this.getNextCloseTime(istTime),
    };
  }

  
  toIST(date) {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60000;
    return new Date(utc + istOffset);
  }

  
  isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  
  isHoliday(date) {
    const dateStr = date.toISOString().split('T')[0];
    const year = date.getFullYear();
    
    if (year === 2024) {
      return this.holidays2024.includes(dateStr);
    } else if (year === 2026) {
      return this.holidays2026.includes(dateStr);
    }
    
    return false;
  }

  
  getNextOpenTime(currentIST) {
    const next = new Date(currentIST);
    
    while (this.isWeekend(next)) {
      next.setDate(next.getDate() + 1);
    }

    next.setHours(this.nseHours.open.hour, this.nseHours.open.minute, 0, 0);

    if (next <= currentIST) {
      next.setDate(next.getDate() + 1);
      while (this.isWeekend(next) || this.isHoliday(next)) {
        next.setDate(next.getDate() + 1);
      }
    }

    return next;
  }

  
  getNextCloseTime(currentIST) {
    const next = new Date(currentIST);
    
    if (this.isWeekend(next) || this.isHoliday(next)) {
      return this.getNextOpenTime(currentIST);
    }

    next.setHours(this.nseHours.close.hour, this.nseHours.close.minute, 0, 0);
    
    if (next <= currentIST) {
      return this.getNextOpenTime(currentIST);
    }

    return next;
  }

  
  getTimeUntilNextEvent() {
    const status = this.getMarketStatus();
    const now = new Date();
    const istTime = this.toIST(now);

    if (status.isOpen) {
      const msUntilClose = status.nextClose - istTime;
      return {
        event: 'market_close',
        milliseconds: msUntilClose,
        minutes: Math.floor(msUntilClose / 60000),
      };
    } else {
      const msUntilOpen = status.nextOpen - istTime;
      return {
        event: 'market_open',
        milliseconds: msUntilOpen,
        minutes: Math.floor(msUntilOpen / 60000),
      };
    }
  }

  
  getOptimalUpdateInterval() {
    const isOpen = this.isNSEOpen();
    
    if (isOpen) {
      return 5 * 60 * 1000; // 5 minutes during market hours
    } else {
      return 30 * 60 * 1000; // 30 minutes after hours (for EOD data)
    }
  }
}

module.exports = new MarketHoursService();
