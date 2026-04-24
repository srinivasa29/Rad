const { getGlobalPulse } = require('../services/macroService');

const getMarketIndices = async (req, res) => {
    try {
        const domesticIndices = [
            { name: "NIFTY", value: "22,500", change: "+0.5%", trend: "up" },
            { name: "SENSEX", value: "74,200", change: "+0.4%", trend: "up" },
            { name: "BANKNIFTY", value: "48,000", change: "-0.2%", trend: "down" },
            { name: "INDIA VIX", value: "13.5", change: "-1.5%", trend: "down" }
        ];

        const globalPulse = await getGlobalPulse();

        res.json({
            domestic: domesticIndices,
            global: globalPulse
        });
    } catch (error) {
        console.error("Ticker Error:", error);
        res.status(500).json({ error: "Failed to fetch ticker data" });
    }
};

const getLatency = (req, res) => {
    const latency = Math.floor(Math.random() * 30) + 10;
    res.json({ latency: `${latency}ms` });
};

module.exports = { getMarketIndices, getLatency };
