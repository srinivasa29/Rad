const { fetchOrderBook } = require('../services/cryptoService');

const getOrderBook = async (req, res) => {
    const { symbol } = req.query;
    
    if (!symbol) return res.status(400).json({ error: "Symbol required" });

    const data = await fetchOrderBook(symbol.toLowerCase());
    
    if (!data) return res.status(404).json({ error: "Order book not found" });

    res.json(data);
};

module.exports = { getOrderBook };