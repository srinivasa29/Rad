const { getMarketStatus } = require('../utils/marketStatus');

const getStatus = (req, res) => {
    const status = getMarketStatus();
    res.json(status);
};

module.exports = { getStatus };
