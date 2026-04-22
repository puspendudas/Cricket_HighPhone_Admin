export const formatUTCDateTime12H = (
  isoString: string | number | Date | undefined | null
): string => {
  if (!isoString) return 'N/A';

  const d = new Date(isoString);

  if (Number.isNaN(d.getTime())) return 'N/A';

  const day = String(d.getUTCDate()).padStart(2, '0');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = monthNames[d.getUTCMonth()];
  const year = d.getUTCFullYear();

  let hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  hours = hours === 0 ? 12 : hours;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};
