const generateHistory = (startPrice, volatility = 0.02, interval = '1D') => {
    let prices = [];
    let currentPrice = startPrice;
    const now = new Date();

    let points = 30;
    let timeDeduction = (i) => i * 24 * 60 * 60 * 1000;

    if (interval === '1H') {
        points = 24;
        timeDeduction = (i) => i * 60 * 60 * 1000;
    } else if (interval === '15M') {
        points = 40;
        timeDeduction = (i) => i * 15 * 60 * 1000;
    }

    for (let i = points; i >= 0; i--) {
        const date = new Date(now.getTime() - timeDeduction(i));
        
        const change = currentPrice * (Math.random() * volatility * 2 - volatility);
        currentPrice += change;

        prices.push({
            date: interval === '1D' ? date.toLocaleDateString() : date.toLocaleString(),
            price: parseFloat(currentPrice.toFixed(2))
        });
    }
    return prices;
};

module.exports = { generateHistory };
