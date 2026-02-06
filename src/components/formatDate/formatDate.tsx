import dayjs from 'dayjs';

export const formatDate = (dateString: string): string => 
    dayjs(dateString).format('YYYY-MM');
