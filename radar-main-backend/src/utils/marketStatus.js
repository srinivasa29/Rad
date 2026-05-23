const getMarketStatus = () => {
    const now = new Date();
    const kolkataParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(now);

    const valueOf = (type) => kolkataParts.find((part) => part.type === type)?.value;
    const weekday = valueOf('weekday');
    const hour = Number(valueOf('hour'));
    const minute = Number(valueOf('minute'));
    const totalMinutes = hour * 60 + minute;
    const isWeekday = !['Sat', 'Sun'].includes(weekday);

    // NSE regular equity session: 09:15 to 15:30 IST, Monday-Friday.
    const nseOpen = 9 * 60 + 15;
    const nseClose = 15 * 60 + 30;
    const isOpenTime = totalMinutes >= nseOpen && totalMinutes <= nseClose;
    const stockOpen = isWeekday && isOpenTime;

    return {
        crypto: { isOpen: true, message: '24/7 Market' },
        forex: { isOpen: isWeekday, message: isWeekday ? 'Market Open' : 'Closed (Weekend)' },
        stock: {
            isOpen: stockOpen,
            message: stockOpen ? 'Market Open' : 'Market Closed',
            timezone: 'Asia/Kolkata',
            session: 'NSE 09:15-15:30 IST',
            checkedAt: now.toISOString(),
        }
    };
};

module.exports = { getMarketStatus };
