# RADAR System Architecture

## Overview
RADAR is a multi-persona (Investor / Trader) financial dashboard that aggregates, processes, and displays real-time market data across multiple asset classes (Stocks, Crypto, Forex). The system is designed with a monolithic Node.js/Express backend that acts as an aggregation and analytics layer, and a Vite/React frontend focused on performance and rendering optimization.

## Core Architectural Pillars

### 1. Multi-Persona UI Architecture
The frontend utilizes a state-driven layout engine (`Dashboard.jsx`) that conditionally mounts distinct interfaces based on the user's selected persona context:
- **Trader Workstation:** Optimized for high-density data, featuring the Bento-grid layout, advanced charts, and real-time execution terminals.
- **Investor Dashboard:** Focused on broader market landscapes, portfolio health, valuation metrics, and long-term thematic trends.

### 2. Analytics Engine & Trend Matrix Logic
The backend processes raw market data into actionable insights rather than just proxying JSON files. 
- **Scoring Model:** Assets are scored based on a combination of technical momentum (RSI, MACD) and fundamental valuation (P/E, P/B ratios). 
- **Trend Matrix:** The backend calculates short-term vs long-term trend divergence and assigns "Conviction Scores" to specific market regimes, directly feeding the `SectorLandscape` and `SignalEnginePanel` components.

### 3. Data Processing and Caching (`CacheService`)
Due to the rate limits imposed by upstream financial data providers (e.g., AlphaVantage, Binance, Finnhub), the Node backend employs an aggressive caching strategy:
- **Time-to-Live (TTL) Caching:** High-frequency data (like indices) is cached for 1-5 minutes. Longer-term data (like valuation metrics) is cached for up to 24 hours.
- **Stale-While-Revalidate:** The cache layer serves the last known good data immediately while fetching fresh data in the background, preventing upstream latency from bottlenecking the client dashboard.

### 4. Resilient Component Design (Error Boundaries)
Following the 6th Sweep Audit, the frontend operates on a "graceful degradation" philosophy. 
- All external data fetching `useEffect` hooks maintain strict `isLoading` and `isError` boundaries. 
- Swallowed exceptions have been eliminated in favor of explicit UI fallbacks (e.g., "Market Feed Offline") to ensure the rest of the application remains functional even if a specific widget's data pipeline collapses.

## Backend Stack
- **Runtime:** Node.js with Express.js
- **Database:** MongoDB (Mongoose ODM for transactional safety)
- **Authentication:** JWT-based stateless sessions

## Frontend Stack
- **Core:** React 18, Vite
- **Styling:** TailwindCSS, CSS Variables (Dark/Light mode overriding)
- **Data Vis:** Recharts (SVG-based charting)
- **Animations:** Framer Motion
