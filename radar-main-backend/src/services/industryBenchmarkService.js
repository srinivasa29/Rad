/**
 * industryBenchmarkService.js
 *
 * Provides industry-average fundamental benchmarks for peer comparison.
 *
 * Strategy:
 *   1. In-memory cache (1h TTL) — hot path for repeated queries
 *   2. Gemini AI generation  — generates realistic industry averages based
 *      on the sector + industry name for the Indian market (NSE)
 *   3. Static fallback table — known broad-sector averages for Indian markets
 *      if Gemini is unavailable
 */

const NodeCache = require('node-cache');
const axios = require('axios');
const logger = require('../utils/logger');

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1h TTL

// ── Static Fallback Benchmarks (Indian market broad sector averages) ─────────
const SECTOR_DEFAULTS = {
    'Technology':             { pe: 28.5,  roe: 22.0,  margin: 18.5, growth: 15.0 },
    'Information Technology':  { pe: 28.5,  roe: 22.0,  margin: 18.5, growth: 15.0 },
    'Financial Services':      { pe: 18.2,  roe: 14.5,  margin: 22.0, growth: 12.0 },
    'Financials':              { pe: 18.2,  roe: 14.5,  margin: 22.0, growth: 12.0 },
    'Healthcare':              { pe: 32.0,  roe: 16.5,  margin: 14.0, growth: 11.0 },
    'Consumer Cyclical':       { pe: 35.0,  roe: 15.0,  margin: 10.5, growth: 14.0 },
    'Consumer Defensive':      { pe: 42.0,  roe: 24.0,  margin: 12.0, growth: 10.0 },
    'Industrials':             { pe: 24.0,  roe: 13.5,  margin: 8.5,  growth: 12.5 },
    'Basic Materials':         { pe: 12.5,  roe: 12.0,  margin: 9.0,  growth: 8.0  },
    'Energy':                  { pe: 10.5,  roe: 15.0,  margin: 7.5,  growth: 6.0  },
    'Utilities':               { pe: 16.0,  roe: 11.0,  margin: 15.0, growth: 7.0  },
    'Real Estate':             { pe: 22.0,  roe: 8.5,   margin: 20.0, growth: 9.0  },
    'Communication Services':  { pe: 20.0,  roe: 12.0,  margin: 16.0, growth: 10.0 },
    'Automobile':              { pe: 30.0,  roe: 14.0,  margin: 8.0,  growth: 13.0 },
    'Pharmaceuticals':         { pe: 28.0,  roe: 18.0,  margin: 16.0, growth: 12.0 },
};

const DEFAULT_BENCHMARK = { pe: 22.0, roe: 14.0, margin: 12.0, growth: 10.0 };

/**
 * Attempt to get industry averages via Gemini AI.
 * Returns { pe, roe, margin, growth } or null on failure.
 */
async function fetchFromGemini(sector, industry) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const prompt = `You are an Indian stock market analyst. For the sector "${sector}" and industry "${industry}" on NSE India, provide the current industry-average benchmarks.

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "pe": <industry average PE ratio as number>,
  "roe": <industry average ROE % as number>,
  "margin": <industry average net profit margin % as number>,
  "growth": <industry average revenue growth % as number>
}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const resp = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
        }, { timeout: 10000 });

        const raw = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const parsed = JSON.parse(cleaned);

        // Validate the shape
        if (typeof parsed.pe === 'number' && typeof parsed.roe === 'number') {
            logger.info(`[IndustryBenchmark] Gemini returned averages for ${sector}/${industry}: PE=${parsed.pe}, ROE=${parsed.roe}%`);
            return {
                pe:     parseFloat(parsed.pe.toFixed(1)),
                roe:    parseFloat(parsed.roe.toFixed(1)),
                margin: parseFloat((parsed.margin || 12).toFixed(1)),
                growth: parseFloat((parsed.growth || 10).toFixed(1)),
            };
        }
    } catch (err) {
        logger.warn(`[IndustryBenchmark] Gemini failed for ${sector}/${industry}: ${err.message}`);
    }
    return null;
}

/**
 * Returns industry benchmark averages for the given sector/industry.
 * @param {string} sector  - e.g. "Technology", "Financial Services"
 * @param {string} industry - e.g. "Information Technology Services"
 * @returns {{ pe: number, roe: number, margin: number, growth: number }}
 */
async function getIndustryBenchmarks(sector, industry) {
    const key = `bench:${(sector || '').toLowerCase()}:${(industry || '').toLowerCase()}`;
    const cached = cache.get(key);
    if (cached) return cached;

    // Try Gemini first
    const geminiResult = await fetchFromGemini(sector || 'General', industry || sector || 'General');
    if (geminiResult) {
        cache.set(key, geminiResult);
        return geminiResult;
    }

    // Static fallback
    const sectorKey = Object.keys(SECTOR_DEFAULTS).find(
        k => k.toLowerCase() === (sector || '').toLowerCase()
    );
    const result = SECTOR_DEFAULTS[sectorKey] || DEFAULT_BENCHMARK;
    cache.set(key, result);
    return result;
}

module.exports = { getIndustryBenchmarks };
