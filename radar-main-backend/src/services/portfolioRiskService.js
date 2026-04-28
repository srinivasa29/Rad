const Portfolio = require('../models/Portfolio');
const { fetchStockData } = require('./stockService');
const { getBatchFundamentals } = require('./fundamentalsEnrichmentService');

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSymbol = (value) => String(value || '').trim().toUpperCase();

const calculatePortfolioRisk = async (userId) => {
    const portfolio = await Portfolio.findOne({ user: userId });
    if (!portfolio) {
        return {
            totalValue: 0,
            holdingsCount: 0,
            var95: 0,
            beta: 1,
            concentration: [],
            riskLevel: 'low',
        };
    }

    const stocks = await fetchStockData();
    const priceMap = new Map((Array.isArray(stocks) ? stocks : []).map((row) => [normalizeSymbol(row.symbol), toNumber(row.price, NaN)]));

    const positions = (portfolio.holdings || []).map((holding) => {
        const symbol = normalizeSymbol(holding.symbol);
        const livePrice = priceMap.get(symbol);
        const price = Number.isFinite(livePrice) ? livePrice : toNumber(holding.avgBuyPrice, 0);
        const quantity = toNumber(holding.quantity, 0);
        const value = price * quantity;
        return { symbol, quantity, price, value };
    }).filter((row) => row.quantity > 0 && row.value > 0);

    const totalHoldingsValue = positions.reduce((sum, row) => sum + row.value, 0);
    const totalValue = totalHoldingsValue + toNumber(portfolio.cashBalance, 0);

    const fundas = await getBatchFundamentals(positions.map(p => p.symbol));
    const sectorMap = {};

    const enrichedPositions = positions.map(row => {
        const info = fundas.get(row.symbol) || {};
        const sector = info.sector || 'Others';
        sectorMap[sector] = (sectorMap[sector] || 0) + row.value;
        return { ...row, sector };
    });

    const sectorWeights = Object.keys(sectorMap).map(name => ({
        name,
        value: Number(sectorMap[name].toFixed(2)),
        weightPct: totalHoldingsValue > 0 ? Number(((sectorMap[name] / totalHoldingsValue) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.value - a.value);

    const concentration = enrichedPositions
        .map((row) => ({
            symbol: row.symbol,
            sector: row.sector,
            value: Number(row.value.toFixed(2)),
            weightPct: totalHoldingsValue > 0 ? Number(((row.value / totalHoldingsValue) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.weightPct - a.weightPct);

    const topWeight = concentration[0]?.weightPct || 0;
    const concentrationPenalty = topWeight / 100;
    const assumedDailyVol = 0.018 + concentrationPenalty * 0.04;
    const z95 = 1.65;
    const var95 = totalHoldingsValue * assumedDailyVol * z95;
    const beta = Number((0.85 + concentrationPenalty * 0.9).toFixed(2));
    const riskScore = Math.min(100, (assumedDailyVol * 1000) + topWeight * 0.6);
    const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

    return {
        totalValue: Number(totalValue.toFixed(2)),
        holdingsCount: positions.length,
        var95: Number(var95.toFixed(2)),
        beta,
        concentration,
        sectorWeights,
        riskLevel,
        assumptions: {
            method: 'parametric-var',
            confidence: 0.95,
            horizon: '1D',
            assumedDailyVolPct: Number((assumedDailyVol * 100).toFixed(2)),
        },
    };
};

module.exports = { calculatePortfolioRisk };
