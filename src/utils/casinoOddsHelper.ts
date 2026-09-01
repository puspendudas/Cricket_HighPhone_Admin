/**
 * Utility to adjust casino odds/rates per game and market type.
 * Ensures high precision and prevents floating point arithmetic inaccuracies.
 * Returns '-' when odds are 0, falsy, suspended, or <= 0.
 *
 * @param rawOdds - The incoming provider/socket odds value (e.g. 1.98, '1.98', '2.05')
 * @param rateDiff - The effective casino rate difference (e.g. 0.02)
 * @param operation - Whether to reduce (subtract) or increase (add) odds
 * @returns - The adjusted odds value (e.g. '1.96') or '-' if suspended/invalid
 */
export function adjustCasinoOdds(
  rawOdds: any,
  rateDiff?: number,
  operation: 'subtract' | 'add' = 'subtract'
): string {
  if (
    rawOdds === null ||
    rawOdds === undefined ||
    rawOdds === '' ||
    rawOdds === '-' ||
    rawOdds === '0' ||
    rawOdds === 0
  ) {
    return '-';
  }

  const numOdds = parseFloat(rawOdds);
  if (Number.isNaN(numOdds) || numOdds <= 0) {
    return '-';
  }

  const diff = parseFloat(String(rateDiff || 0));
  if (Number.isNaN(diff) || diff <= 0) {
    const isOriginalDecimal = String(rawOdds).includes('.');
    return isOriginalDecimal ? numOdds.toFixed(2) : numOdds.toString();
  }

  // Calculate with high precision
  let adjusted = numOdds;
  if (operation === 'add') {
    adjusted = Math.round((numOdds + diff) * 10000) / 10000;
  } else {
    adjusted = Math.max(0, Math.round((numOdds - diff) * 10000) / 10000);
  }

  if (adjusted <= 0) {
    return '-';
  }

  const isOriginalDecimal = String(rawOdds).includes('.');
  if (isOriginalDecimal) {
    return adjusted.toFixed(2);
  }

  return adjusted > 0 ? adjusted.toString() : '-';
}

/**
 * Adjust 20-20 Teenpatti (TEEN20) odds: Reduces Back odds.
 */
export function adjustTeen20Odds(rawOdds: any, backDiff?: number): string {
  return adjustCasinoOdds(rawOdds, backDiff, 'subtract');
}

/**
 * Adjust Teenpatti 1-day (TEEN) odds:
 * - Back odds: Reduces rate (rawBack - backDiff)
 * - Lay odds: Increases rate (rawLay + layDiff)
 */
export function adjustTeenOdds(rawOdds: any, betType: string, backDiff?: number, layDiff?: number): string {
  const isLay = String(betType).toUpperCase() === 'LAY' || String(betType).toLowerCase() === 'l';
  if (isLay) {
    return adjustCasinoOdds(rawOdds, layDiff, 'add');
  }
  return adjustCasinoOdds(rawOdds, backDiff, 'subtract');
}

/**
 * Adjust Dragon Tiger 20-20 (DT20) odds:
 * Reduces rate ONLY for "nat": "Dragon" and "nat": "Tiger" (or "Player A" and "Player B").
 * All other side markets (Tie, Pair, Suited Tie) remain unchanged.
 */
export function adjustDt20Odds(rawOdds: any, selectionName?: string, rateDiff?: number): string {
  if (!selectionName) {
    return adjustCasinoOdds(rawOdds, rateDiff, 'subtract');
  }
  const name = String(selectionName).toLowerCase().trim();
  const isDragonOrTiger = name === 'dragon' || name === 'tiger' || name === 'player a' || name === 'player b';

  if (isDragonOrTiger) {
    return adjustCasinoOdds(rawOdds, rateDiff, 'subtract');
  }

  // Other side bets stay as original rate
  return adjustCasinoOdds(rawOdds, 0, 'subtract');
}

/**
 * Adjust Lucky 7 (LUCKY7EU) odds:
 * Reduces rate ONLY for "nat": "Low Card" and "nat": "High Card".
 * All other side markets (Card 7, Red, Black, Even, Odd) remain unchanged.
 */
export function adjustLucky7Odds(rawOdds: any, selectionName?: string, rateDiff?: number): string {
  if (!selectionName) {
    return adjustCasinoOdds(rawOdds, rateDiff, 'subtract');
  }
  const name = String(selectionName).toLowerCase().trim();
  const isLowOrHigh = name.includes('low') || name.includes('high');

  if (isLowOrHigh) {
    return adjustCasinoOdds(rawOdds, rateDiff, 'subtract');
  }

  // Other side bets stay as original rate
  return adjustCasinoOdds(rawOdds, 0, 'subtract');
}

export default adjustCasinoOdds;
