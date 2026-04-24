const BacktestJob = require('../models/BacktestJob');
const { fetchStockHistory } = require('./stockService');

const toNumber = (value, fallback = NaN) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSymbol = (value) => String(value || '').trim().toUpperCase();

const computeBacktest = (history, config = {}) => {
    const closes = (Array.isArray(history) ? history : [])
        .map((row) => toNumber(row?.price, NaN))
        .filter((value) => Number.isFinite(value) && value > 0);

    if (closes.length < 3) {
        return {
            trades: 0,
            winRate: 0,
            totalReturnPct: 0,
            maxDrawdownPct: 0,
            sharpe: 0,
            equityCurve: [],
        };
    }

    const initialCapital = Math.max(1, toNumber(config.initialCapital, 100000));
    const positionSizePct = Math.max(0.05, Math.min(1, toNumber(config.positionSizePct, 0.2)));
    let equity = initialCapital;
    let peak = equity;
    let maxDrawdown = 0;
    let trades = 0;
    let wins = 0;
    const curve = [];

    for (let i = 1; i < closes.length; i += 1) {
        const prev = closes[i - 1];
        const current = closes[i];
        const dailyRet = (current - prev) / prev;
        const pnl = equity * positionSizePct * dailyRet;
        equity += pnl;
        trades += 1;
        if (pnl >= 0) {
            wins += 1;
        }
        peak = Math.max(peak, equity);
        const drawdown = ((peak - equity) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
        curve.push(Number(equity.toFixed(2)));
    }

    const totalReturnPct = ((equity - initialCapital) / initialCapital) * 100;
    const avgRet = totalReturnPct / Math.max(trades, 1);
    const variance = curve.length > 1
        ? curve.reduce((sum, point, idx, arr) => {
            if (idx === 0) return sum;
            const r = (point - arr[idx - 1]) / Math.max(arr[idx - 1], 1);
            return sum + (r - (avgRet / 100)) ** 2;
        }, 0) / (curve.length - 1)
        : 0;
    const stdev = Math.sqrt(Math.max(variance, 0));
    const sharpe = stdev > 0 ? (avgRet / 100) / stdev : 0;

    return {
        trades,
        winRate: Number(((wins / Math.max(trades, 1)) * 100).toFixed(2)),
        totalReturnPct: Number(totalReturnPct.toFixed(2)),
        maxDrawdownPct: Number(maxDrawdown.toFixed(2)),
        sharpe: Number(sharpe.toFixed(3)),
        equityCurve: curve.slice(-120),
    };
};

const runBacktestJob = async (userId, payload = {}) => {
    const symbol = normalizeSymbol(payload.symbol || '');
    if (!symbol) {
        const error = new Error('symbol is required');
        error.statusCode = 400;
        throw error;
    }

    const job = await BacktestJob.create({
        user: userId,
        status: 'running',
        request: payload,
    });

    try {
        const interval = String(payload.interval || '1M').toUpperCase();
        const history = await fetchStockHistory(symbol, interval, { allowSynthetic: false });
        const result = computeBacktest(history, payload);

        job.status = 'completed';
        job.result = {
            symbol,
            interval,
            computedAt: new Date().toISOString(),
            ...result,
        };
        await job.save();
        return job;
    } catch (error) {
        job.status = 'failed';
        job.error = error.message || 'Backtest failed';
        await job.save();
        return job;
    }
};

const getBacktestJob = async (userId, jobId) => {
    const job = await BacktestJob.findOne({ _id: jobId, user: userId });
    if (!job) {
        const error = new Error('Backtest job not found');
        error.statusCode = 404;
        throw error;
    }
    return job;
};

module.exports = {
    runBacktestJob,
    getBacktestJob,
};
