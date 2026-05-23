export const getNseStatus = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const valueOf = (type) => parts.find((part) => part.type === type)?.value;
  const weekday = valueOf('weekday');
  const minutes = Number(valueOf('hour')) * 60 + Number(valueOf('minute'));
  const isWeekday = !['Sat', 'Sun'].includes(weekday);
  const isOpen = isWeekday && minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
  return {
    isOpen,
    label: isOpen ? 'Market Open' : 'Market Closed',
    detail: 'NSE 09:15-15:30 IST',
  };
};
