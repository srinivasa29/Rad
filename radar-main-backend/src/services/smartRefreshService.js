

const freeApiAggregator = require('./freeApiAggregator');
const incrementalUpdateService = require('./incrementalUpdateService');
const marketHoursService = require('./marketHoursService');
const logger = require('../utils/logger');

class SmartRefreshService {
  constructor() {
    this.refreshIntervals = {
      tier1: 60 * 1000,       // 1 minute (Nifty 50)
      tier2: 5 * 60 * 1000,   // 5 minutes (Watchlist)
      tier3: 15 * 60 * 1000,  // 15 minutes (Others)
    };

    this.lastRefresh = {
      tier1: {},
      tier2: {},
      tier3: {},
    };

    this.symbolTiers = {
      tier1: this.getNifty50Symbols(),
      tier2: [],
      tier3: [],
    };

    this.isRunning = false;
    this.refreshCount = 0;
    this.stats = {
      tier1Refreshes: 0,
      tier2Refreshes: 0,
      tier3Refreshes: 0,
      totalRefreshes: 0,
      errors: 0,
    };
  }

  
  start() {
    if (this.isRunning) {
      logger.warn('Smart refresh already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting smart refresh service');

    this.startTierRefresh('tier1', this.refreshIntervals.tier1);
    this.startTierRefresh('tier2', this.refreshIntervals.tier2);
    this.startTierRefresh('tier3', this.refreshIntervals.tier3);
  }

  
  stop() {
    this.isRunning = false;
    logger.info('Smart refresh service stopped');
  }

  
  startTierRefresh(tier, interval) {
    const refresh = async () => {
      if (!this.isRunning) return;

      try {
        if ((tier === 'tier1' || tier === 'tier2') && !marketHoursService.shouldFetchUpdates()) {
          logger.debug(`${tier}: Market closed, skipping refresh`);
          setTimeout(refresh, interval);
          return;
        }

        const symbols = this.symbolTiers[tier];
        if (symbols.length === 0) {
          setTimeout(refresh, interval);
          return;
        }

        logger.info(`${tier}: Refreshing ${symbols.length} symbols`);
        await this.refreshTier(tier, symbols);

        this.stats[`${tier}Refreshes`]++;
        this.stats.totalRefreshes++;
      } catch (error) {
        logger.error(`Error refreshing ${tier}:`, error.message);
        this.stats.errors++;
      }

      setTimeout(refresh, interval);
    };

    setTimeout(refresh, 1000); // Start after 1 second
  }

  
  async refreshTier(tier, symbols) {
    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;

    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      for (const symbol of batch) {
        try {
          if (!this.needsRefresh(tier, symbol)) {
            continue;
          }

          if (tier === 'tier1') {
            const result = await freeApiAggregator.getQuote(`${symbol}.NS`, {
              preferredSource: 'auto',
              maxAge: 60000,
            });

            if (result.success) {
              this.lastRefresh[tier][symbol] = Date.now();
              successCount++;
            } else {
              failCount++;
            }
          } else {
            const result = await incrementalUpdateService.updateSymbol(symbol, '1d');
            
            if (result.success) {
              this.lastRefresh[tier][symbol] = Date.now();
              successCount++;
            } else {
              failCount++;
            }
          }

          await this.sleep(200);
        } catch (error) {
          logger.error(`Error refreshing ${symbol}:`, error.message);
          failCount++;
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`${tier}: Refreshed ${successCount}/${symbols.length} symbols in ${Math.round(duration / 1000)}s`);
  }

  
  needsRefresh(tier, symbol) {
    const lastRefreshTime = this.lastRefresh[tier][symbol];
    if (!lastRefreshTime) return true;

    const timeSinceRefresh = Date.now() - lastRefreshTime;
    return timeSinceRefresh >= this.refreshIntervals[tier];
  }

  
  addSymbolToTier(symbol, tier = 2) {
    const tierKey = `tier${tier}`;
    
    if (!this.symbolTiers[tierKey]) {
      logger.error(`Invalid tier: ${tier}`);
      return false;
    }

    Object.keys(this.symbolTiers).forEach(key => {
      this.symbolTiers[key] = this.symbolTiers[key].filter(s => s !== symbol);
    });

    if (!this.symbolTiers[tierKey].includes(symbol)) {
      this.symbolTiers[tierKey].push(symbol);
      logger.info(`Added ${symbol} to ${tierKey}`);
      return true;
    }

    return false;
  }

  
  addSymbolsToTier(symbols, tier = 2) {
    symbols.forEach(symbol => this.addSymbolToTier(symbol, tier));
  }

  
  removeSymbol(symbol) {
    Object.keys(this.symbolTiers).forEach(tier => {
      this.symbolTiers[tier] = this.symbolTiers[tier].filter(s => s !== symbol);
    });

    logger.info(`Removed ${symbol} from all tiers`);
  }

  
  getSymbolTier(symbol) {
    for (const [tier, symbols] of Object.entries(this.symbolTiers)) {
      if (symbols.includes(symbol)) {
        return parseInt(tier.replace('tier', ''));
      }
    }
    return null;
  }

  
  getStatus() {
    const marketStatus = marketHoursService.getMarketStatus();

    return {
      isRunning: this.isRunning,
      marketOpen: marketStatus.isOpen,
      tiers: {
        tier1: {
          name: 'Nifty 50 (Real-time)',
          interval: '1 minute',
          symbolCount: this.symbolTiers.tier1.length,
          refreshes: this.stats.tier1Refreshes,
        },
        tier2: {
          name: 'Watchlist (Frequent)',
          interval: '5 minutes',
          symbolCount: this.symbolTiers.tier2.length,
          refreshes: this.stats.tier2Refreshes,
        },
        tier3: {
          name: 'Other Stocks (Periodic)',
          interval: '15 minutes',
          symbolCount: this.symbolTiers.tier3.length,
          refreshes: this.stats.tier3Refreshes,
        },
      },
      stats: this.stats,
    };
  }

  
  getStats() {
    return {
      ...this.stats,
      symbolDistribution: {
        tier1: this.symbolTiers.tier1.length,
        tier2: this.symbolTiers.tier2.length,
        tier3: this.symbolTiers.tier3.length,
      },
      averageRefreshesPerSymbol: {
        tier1: this.symbolTiers.tier1.length > 0 
          ? (this.stats.tier1Refreshes / this.symbolTiers.tier1.length).toFixed(2)
          : 0,
        tier2: this.symbolTiers.tier2.length > 0
          ? (this.stats.tier2Refreshes / this.symbolTiers.tier2.length).toFixed(2)
          : 0,
        tier3: this.symbolTiers.tier3.length > 0
          ? (this.stats.tier3Refreshes / this.symbolTiers.tier3.length).toFixed(2)
          : 0,
      },
    };
  }

  
  getNifty50Symbols() {
    return [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
      'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
      'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH',
      'BAJFINANCE', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'NESTLEIND',
      'SUNPHARMA', 'TECHM', 'ONGC', 'NTPC', 'POWERGRID',
      'M&M', 'TATASTEEL', 'ADANIPORTS', 'BAJAJFINSV', 'JSWSTEEL',
      'INDUSINDBK', 'TATAMOTORS', 'HINDALCO', 'DIVISLAB', 'COALINDIA',
      'DRREDDY', 'EICHERMOT', 'CIPLA', 'GRASIM', 'BRITANNIA',
      'HEROMOTOCO', 'SHREECEM', 'APOLLOHOSP', 'UPL', 'BPCL',
      'TATACONSUM', 'SBILIFE', 'ADANIENT', 'HDFCLIFE', 'BAJAJ-AUTO',
    ];
  }

  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SmartRefreshService();
