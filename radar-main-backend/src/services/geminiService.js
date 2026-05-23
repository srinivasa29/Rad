/**
 * geminiService.js
 * Calls the Gemini 1.5 Flash API via REST to generate AI-powered stock insights.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generates structured stock insights for the Signals tab using Gemini AI.
 * Falls back to a hardcoded structure if Gemini is unavailable.
 */
const generateStockInsights = async (symbol, stockData = {}) => {
    const {
        price = 0,
        changePercent = 0,
        rsi = 50,
        macd = 0,
        ema20 = 0,
        ema50 = 0,
        beta = 1,
        sector = 'Equity',
        term = 'medium',
        peRatio = null,
        revenueGrowth = null,
    } = stockData;

    const termLabel = term === 'short' ? 'Short-term (intraday/weekly)' : term === 'long' ? 'Long-term (monthly/yearly)' : 'Medium-term (swing trading)';

    const prompt = `You are an expert Indian stock market analyst. Analyze ${symbol} (NSE India) and provide structured trading insights.

Context:
- Current Price: ₹${price}
- Day Change: ${changePercent > 0 ? '+' : ''}${changePercent}%
- RSI (14): ${rsi}
- MACD: ${macd}
- EMA20: ₹${ema20}, EMA50: ₹${ema50}
- Beta: ${beta}
- Sector: ${sector}
- Analysis Horizon: ${termLabel}
${peRatio ? `- P/E Ratio: ${peRatio}` : ''}
${revenueGrowth ? `- Revenue Growth: ${(revenueGrowth * 100).toFixed(1)}%` : ''}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in exactly this structure:
{
  "overallSentiment": {
    "label": "Bullish|Neutral|Bearish|Strongly Bullish|Strongly Bearish",
    "score": "7.2",
    "setup": "GOOD SETUP|STRONG SETUP|NEUTRAL SETUP|WEAK SETUP",
    "value": 65,
    "insight": "One concise sentence explaining the overall signal."
  },
  "trendSignals": {
    "items": [
      {"name": "EMA Trend", "val": "Above EMA20", "status": "Bullish", "s": "green", "imp": "Price is trending above short-term average"},
      {"name": "MACD Signal", "val": "0.45", "status": "Bullish Crossover", "s": "green", "imp": "Momentum turning positive"},
      {"name": "Trend Structure", "val": "Higher Highs", "status": "Intact", "s": "green", "imp": "Uptrend structure maintained"}
    ]
  },
  "momentumSignals": {
    "items": [
      {"name": "RSI (14)", "val": "${rsi}", "status": "${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Healthy'}", "s": "${rsi > 70 ? 'amber' : rsi < 30 ? 'red' : 'green'}", "imp": "Momentum indicator reading"},
      {"name": "Rate of Change", "val": "Positive", "status": "Expanding", "s": "green", "imp": "Price velocity is increasing"},
      {"name": "Stochastic", "val": "65.2", "status": "Positive", "s": "green", "imp": "Fast line above slow line"}
    ]
  },
  "volatilityRisk": {
    "items": [
      {"name": "Beta", "val": "${beta}", "status": "${beta > 1.2 ? 'High Risk' : beta < 0.8 ? 'Low Risk' : 'Market Risk'}", "s": "${beta > 1.2 ? 'amber' : 'green'}", "imp": "Market sensitivity measure"},
      {"name": "ATR", "val": "Moderate", "status": "Stable", "s": "green", "imp": "Daily price range is within normal bounds"},
      {"name": "Volatility Band", "val": "Normal", "status": "Contained", "s": "green", "imp": "Price within Bollinger band range"}
    ]
  },
  "keyLevels": {
    "s2": {"label": "S2", "pos": "10%", "val": "Strong support level"},
    "s1": {"label": "S1", "pos": "30%", "val": "Immediate support"},
    "current": {"pos": "65%", "val": "₹${price}"},
    "r1": {"label": "R1", "pos": "80%", "val": "Immediate resistance"},
    "r2": {"label": "R2", "pos": "92%", "val": "Strong resistance"},
    "interpretation": "One sentence about key support/resistance context for ${symbol}."
  },
  "volumeInsights": {
    "volumeVsAvg": "+12%",
    "trend": "Upward",
    "trendColor": "text-green-600",
    "conviction": "High",
    "convictionColor": "text-emerald-500",
    "note": "One sentence about volume pattern and what it implies for ${symbol}."
  },
  "priceBehavior": {
    "items": [
      {"label": "Weekly Change", "val": "${changePercent > 0 ? '+' : ''}${changePercent}%", "color": "${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}"},
      {"label": "Distance from 52W High", "val": "-5.2%", "color": "text-amber-600"},
      {"label": "Price Structure", "val": "Ascending", "color": "text-slate-600"}
    ],
    "note": "One sentence about recent price behavior pattern for ${symbol}."
  },
  "marketParticipation": {
    "items": [
      {"label": "Delivery %", "val": "52%", "color": "text-emerald-600"},
      {"label": "Institutional Flow", "val": "Moderate Inflow", "color": "text-green-600"},
      {"label": "Retail Participation", "val": "Medium", "color": "text-slate-500"}
    ],
    "note": "One sentence about institutional vs retail activity."
  },
  "trendAlignment": {
    "pills": ["bg-green-500", "bg-green-500", "bg-amber-500"],
    "status": "Bullish Alignment",
    "statusColor": "bg-green-100 text-green-700",
    "note": "Short and medium-term trends aligned."
  },
  "signalConsistency": {
    "track": [1, 1, 0.5, 1, 1, 0.5, 1, 1, 1, 0.5],
    "score": 78,
    "note": "Signal consistency note for recent 10 periods."
  },
  "riskAlerts": [
    {"type": "warning", "label": "Risk Factor", "desc": "Key risk to watch for ${symbol}."},
    {"type": "safe", "label": "Strength", "desc": "Key positive factor for ${symbol}."}
  ],
  "recentChanges": [
    {"time": "Today", "desc": "Key technical event or observation for ${symbol}."},
    {"time": "This week", "desc": "Recent trend development for ${symbol}."}
  ]
}`;

    try {
        if (!GEMINI_API_KEY) {
            logger.warn('[Gemini] API key not set, using fallback signals.');
            return null;
        }

        const response = await axios.post(
            GEMINI_URL,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 2048
                }
            },
            { timeout: 15000 }
        );

        const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Strip any accidental markdown fences
        const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const parsed = JSON.parse(cleaned);

        logger.info(`[Gemini] Successfully generated insights for ${symbol}`);
        return parsed;

    } catch (err) {
        logger.error(`[Gemini] Failed to generate insights for ${symbol}: ${err.message}`);
        return null;
    }
};

module.exports = { generateStockInsights };
