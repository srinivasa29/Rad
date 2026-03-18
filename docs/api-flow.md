# RADAR API Data Flow

## Overview
The RADAR API operates as a **BFF (Backend For Frontend)**. Instead of the React application making dozens of isolated requests to various external third-party data providers, it makes consolidated, authenticated requests to our Node.js aggregation layer.

## Multi-Source API Cascade

### The Aggregation Problem
A typical trader dashboard needs:
1. Live price quotes (Binance, WebSockets)
2. Historical candles (AlphaVantage)
3. Fundamental data (Finnhub)
4. Macroeconomic events (ForexFactory / TradingEconomics)

### The Cascade Solution
When a client requests the `/api/market/summary` endpoint, the backend executes a **cascading fan-out** request:
1. **Parallel Execution:** `Promise.all()` is utilized to simultaneously hit the Cache Layer for the required subsets of data.
2. **Missed Cache Fallback:** If a cache miss occurs, the specific service module (e.g., `cryptoService.js`, `stockService.js`) fires an HTTP request to the external provider.
3. **Normalization:** The raw payloads from Binance (Crypto) and AlphaVantage (Stocks) have entirely different schemas. The RADAR backend normalizes these into a single, unified `Asset` interface.
4. **Enrichment:** The analytics engine appends proprietary technical scores to the normalized assets.
5. **Delivery:** The unified, enriched payload is returned to the React frontend.

## Key API Endpoints

### 1. `GET /api/market/summary`
- **Purpose:** Feeds the main dashboard widgets (Ticker Tape, Global Pulse).
- **Flow:** Cache -> Normalized Price Engine -> Response.

### 2. `GET /api/fundamental/valuation`
- **Purpose:** Powers the `ValuationThermometer` and fundamental sweeps.
- **Flow:** Cache (24h TTL) -> Finnhub API -> Aggregated P/E & P/B Math -> Response.

### 3. `POST /api/portfolio/trade`
- **Purpose:** Executes paper-trading orders.
- **Flow:** 
  1. Input validation (positive qty, valid ticker).
  2. Start `mongoose.startTransaction()`.
  3. Validate cash balance (if BUY) or holding quantities (if SELL).
  4. Perform arithmetic modifications.
  5. `session.commitTransaction()` or `session.abortTransaction()` on failure.
  6. Return updated portfolio.

## Error Handling & Resiliency
- **Backend Constraints:** External API requests are wrapped in timeouts (e.g., 5000ms). If an external provider times out, the backend gracefully falls back to the last known cached data (even if expired) and flags the payload as `stale`.
- **Frontend Fallbacks:** If the RADAR backend itself fails to respond (HTTP 5xx), the React components catch the localized rejection and display widget-specific error skeletons without crashing the entire workstation interface.
