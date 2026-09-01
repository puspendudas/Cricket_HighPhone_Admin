export const CASINO_GAMES: Record<string, string> = {
  teen20: '20-20 TEENPATTI',
  teen: 'TEEN PATTI 1 DAY',
  dt20: '20-20 DRAGON TIGER',
  lucky7eu: 'LUCKY 7 B',
  lucky7eu2: 'LUCKY 7 A',
  card32eu: '32 CARDS',
  aaa: 'AMAR AKBAR ANTHONY',
  roulette: 'ROULETTE',
  ab20: 'ANDAR BAHAR',
  baccarat: 'BACCARAT',
};

export const CASINO_GAME_CODES = Object.keys(CASINO_GAMES);

export function isCasinoGame(code?: string): boolean {
  if (!code) return false;
  const normalized = code.toLowerCase().trim();
  return CASINO_GAME_CODES.includes(normalized);
}

export function getCasinoGameTitle(code?: string): string {
  if (!code) return 'Casino Game';
  const normalized = code.toLowerCase().trim();
  return CASINO_GAMES[normalized] || code.toUpperCase();
}

export function getCasinoSelections(code?: string): string[] {
  if (!code) return ['Player A', 'Player B'];
  const normalized = code.toLowerCase().trim();

  if (normalized === 'dt20') {
    return ['Dragon', 'Tiger', 'Tie'];
  }
  if (normalized === 'lucky7eu' || normalized === 'lucky7eu2') {
    return ['Low', 'High', 'Even', 'Odd', 'Red', 'Black'];
  }
  if (normalized === 'card32eu') {
    return ['8', '9', '10', '11'];
  }
  if (normalized === 'aaa') {
    return ['Amar', 'Akbar', 'Anthony'];
  }
  if (normalized === 'ab20') {
    return ['Andar', 'Bahar'];
  }

  return ['Player A', 'Player B'];
}
