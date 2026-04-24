const getDashboardData = (req, res) => {
    res.json({
        activeContracts: [
            { symbol: "NIFTY 22500 CE", type: "Call", oi: "2.5M", change: "+15%" },
            { symbol: "BANKNIFTY 48000 PE", type: "Put", oi: "1.8M", change: "-5%" }
        ],
        pcr: {
            nifty: 0.95,
            banknifty: 1.12
        },
        buildup: {
            long: ["RELIANCE", "INFY"],
            short: ["HDFCBANK", "SBIN"]
        }
    });
};

module.exports = { getDashboardData };
