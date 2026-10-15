export const BASE_URL =
  typeof window !== 'undefined' && window.location.hostname.includes('highphone11')
    ? 'https://server.highphone11.com/api/v1'
    : ((import.meta as any).env?.VITE_SERVER_URL || 'https://server.testingexch.com/api/v1');
