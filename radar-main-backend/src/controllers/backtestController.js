const { runBacktestJob, getBacktestJob } = require('../services/backtestService');

const runBacktest = async (req, res) => {
    try {
        const userId = req.user._id;
        const payload = (req.body && typeof req.body === 'object') ? req.body : {};
        const job = await runBacktestJob(userId, payload);

        const statusCode = job.status === 'failed' ? 422 : 202;
        return res.status(statusCode).json({
            success: job.status !== 'failed',
            data: {
                id: String(job._id),
                status: job.status,
                result: job.result,
                error: job.error || null,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            },
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to run backtest',
        });
    }
};

const getBacktestStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const job = await getBacktestJob(userId, req.params.id);
        return res.json({
            success: true,
            data: {
                id: String(job._id),
                status: job.status,
                request: job.request,
                result: job.result,
                error: job.error || null,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            },
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to fetch backtest status',
        });
    }
};

module.exports = {
    runBacktest,
    getBacktestStatus,
};
