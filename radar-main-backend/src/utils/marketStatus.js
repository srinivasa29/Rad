const getMarketStatus = () => {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    const day = nyTime.getDay();
    const hour = nyTime.getHours();
    const minute = nyTime.getMinutes();
    const totalMinutes = hour * 60 + minute;

    const isOpenTime = totalMinutes >= 570 && totalMinutes < 960;
    const isWeekday = day >= 1 && day <= 5;

    return {
        crypto: { isOpen: true, message: '24/7 Market' },
        forex: { isOpen: isWeekday, message: isWeekday ? 'Market Open' : 'Closed (Weekend)' },
        stock: { isOpen: isWeekday && isOpenTime, message: isWeekday && isOpenTime ? 'Market Open' : 'Market Closed' }
    };
};

module.exports = { getMarketStatus };
