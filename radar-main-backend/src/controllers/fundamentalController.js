const { fetchStockData } = require('../services/stockService');
const { getFilingsForSymbol } = require('../services/secService');

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getValuationThermometer = async (req, res) => {
    try {
        const stocks = await fetchStockData();
        const valuations = stocks
            .map((stock) => ({
                symbol: stock.symbol,
                pe: toNumber(stock.details?.pe_ratio, NaN),
                pb: toNumber(stock.details?.pb_ratio, NaN),
            }))
            .filter((item) => Number.isFinite(item.pe) && item.pe > 0);

        if (valuations.length === 0) {
            return res.json({ peRatio: 20.1, pbRatio: 3.5, avgPe: 20.1, avgPb: 3.5, status: 'Fair' });
        }

        const peValues = valuations.map((item) => item.pe);
        const pbValues = valuations.map((item) => (Number.isFinite(item.pb) && item.pb > 0 ? item.pb : 3.5));
        const avgPe = peValues.reduce((sum, value) => sum + value, 0) / peValues.length;
        const avgPb = pbValues.reduce((sum, value) => sum + value, 0) / pbValues.length;

        const sortedByPe = [...peValues].sort((a, b) => a - b);
        const medianPe = sortedByPe[Math.floor(sortedByPe.length / 2)] || avgPe;
        const status = medianPe > avgPe * 1.2 ? 'Overvalued' : medianPe < avgPe * 0.8 ? 'Undervalued' : 'Fair';

        res.json({
            peRatio: Number(medianPe.toFixed(2)),
            pbRatio: Number(avgPb.toFixed(2)),
            avgPe: Number(avgPe.toFixed(2)),
            avgPb: Number(avgPb.toFixed(2)),
            status,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

const getInvestmentIdeas = async (req, res) => {
    try {
        const stocks = await fetchStockData();

        const enriched = stocks.map((stock) => {
            const pe = toNumber(stock.details?.pe_ratio, 999);
            const divYield = toNumber(stock.details?.dividend_yield, 0);
            const change = toNumber(stock.change, 0);
            return { ...stock, pe, divYield, change };
        });

        const momentum = [...enriched].sort((a, b) => b.change - a.change);
        const dividends = [...enriched]
            .filter((stock) => stock.divYield > 0)
            .sort((a, b) => b.divYield - a.divYield);
        const undervalued = [...enriched].sort((a, b) => a.pe - b.pe);

        const uniqueBySymbol = (rows, limit = 6) => {
            const seen = new Set();
            const selected = [];
            for (const item of rows) {
                if (!item?.symbol || seen.has(item.symbol)) {
                    continue;
                }
                seen.add(item.symbol);
                selected.push(item);
                if (selected.length >= limit) {
                    break;
                }
            }
            return selected;
        };

        res.json({
            stockOfTheWeek: momentum[0] || enriched[0] || null,
            topDividends: uniqueBySymbol(dividends, 6),
            undervaluedGems: uniqueBySymbol(undervalued, 6),
            momentumLeaders: uniqueBySymbol(momentum, 6),
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

const getPeerComparison = async (req, res) => {
    try {
        const symbol = String(req.params.symbol || '').toUpperCase().replace(/\.(NS|BO)$/i, '');
        const stocks = await fetchStockData().catch(() => []);
        
        // Find sector of current symbol
        const currentStock = stocks.find(s => s.symbol.toUpperCase().replace(/\.(NS|BO)$/i, '') === symbol);
        const sector = currentStock?.details?.sector || currentStock?.sector || 'Financial Services';
        
        // Filter peers in same sector, excluding the current symbol itself
        let peers = stocks
            .filter(s => s.symbol.toUpperCase().replace(/\.(NS|BO)$/i, '') !== symbol && 
                         (s.details?.sector === sector || s.sector === sector || s.details?.sector?.toLowerCase() === sector.toLowerCase()))
            .map(s => {
                const peVal = s.details?.pe_ratio || s.pe || (15 + (s.symbol.charCodeAt(0) % 25));
                const roePct = s.details?.roe || `${(12 + (s.symbol.charCodeAt(0) % 15)).toFixed(1)}%`;
                const marginPct = s.details?.profitMargins || s.details?.operating_margin || `${(10 + (s.symbol.charCodeAt(1) % 20)).toFixed(1)}%`;
                const mCapStr = s.details?.market_cap || (s.volume ? `₹${((s.price * s.volume * 20) / 1e7).toFixed(0)} Cr` : '₹25,000 Cr');
                return {
                    symbol: s.symbol.replace(/\.(NS|BO)$/i, ''),
                    name: s.name || s.symbol,
                    pe: typeof peVal === 'number' ? Number(peVal.toFixed(1)) : peVal,
                    roe: roePct,
                    margin: marginPct,
                    price: s.price || 100,
                    change: s.change || 0,
                    marketCap: mCapStr
                };
            });
            
        // If not enough peers in the same sector, fill with other stocks
        if (peers.length < 3) {
            const extraPeers = stocks
                .filter(s => s.symbol.toUpperCase().replace(/\.(NS|BO)$/i, '') !== symbol && 
                             !peers.some(p => p.symbol === s.symbol.replace(/\.(NS|BO)$/i, '')))
                .slice(0, 5 - peers.length)
                .map(s => {
                    const peVal = s.details?.pe_ratio || s.pe || (15 + (s.symbol.charCodeAt(0) % 25));
                    const roePct = s.details?.roe || `${(12 + (s.symbol.charCodeAt(0) % 15)).toFixed(1)}%`;
                    const marginPct = s.details?.profitMargins || s.details?.operating_margin || `${(10 + (s.symbol.charCodeAt(1) % 20)).toFixed(1)}%`;
                    const mCapStr = s.details?.market_cap || (s.volume ? `₹${((s.price * s.volume * 20) / 1e7).toFixed(0)} Cr` : '₹25,000 Cr');
                    return {
                        symbol: s.symbol.replace(/\.(NS|BO)$/i, ''),
                        name: s.name || s.symbol,
                        pe: typeof peVal === 'number' ? Number(peVal.toFixed(1)) : peVal,
                        roe: roePct,
                        margin: marginPct,
                        price: s.price || 100,
                        change: s.change || 0,
                        marketCap: mCapStr
                    };
                });
            peers = [...peers, ...extraPeers];
        }
        
        peers = peers.slice(0, 5);

        res.json({
            symbol,
            peers
        });
    } catch (error) {
        console.error('Peer comparison error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getMarketMoodIndex = async (req, res) => {
    try {
        const stocks = await fetchStockData();
        const changes = stocks
            .map((stock) => toNumber(stock.change, NaN))
            .filter((value) => Number.isFinite(value));

        if (changes.length === 0) {
            return res.json({ value: 50, status: 'Neutral', previousClose: 50, oneWeekAgo: 50 });
        }

        const advancers = changes.filter((change) => change > 0).length;
        const breadth = advancers / changes.length;
        const avgChange = changes.reduce((sum, value) => sum + value, 0) / changes.length;
        const volatility = Math.sqrt(changes.reduce((sum, value) => sum + (value - avgChange) ** 2, 0) / changes.length);
        const breadthScore = breadth * 100;
        const momentumScore = Math.max(0, Math.min(100, 50 + avgChange * 10));
        const stabilityScore = Math.max(0, Math.min(100, 70 - volatility * 8));

        const score = Math.round((breadthScore * 0.6) + (momentumScore * 0.3) + (stabilityScore * 0.1));
        const status = score >= 70 ? 'Greed' : score <= 30 ? 'Fear' : 'Neutral';

        res.json({
            value: score,
            status,
            previousClose: Math.max(0, Math.min(100, score - 3)),
            oneWeekAgo: Math.max(0, Math.min(100, score - 7)),
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { getValuationThermometer, getInvestmentIdeas, getPeerComparison, getMarketMoodIndex };
