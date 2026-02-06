// src/utils/commissionUtils.ts

export interface Bet {
  bet_type: string;
  selection: string;
  status: string;
  stake_amount: string | number;
  potential_winnings: string | number;
  immediate_child_admin?: {
    _id: string;
    match_commission?: number;
    session_commission?: number;
    share?: number;
    user_name?: string;
    name?: string;
  };
}

export interface CommissionResult {
  matchPL: number;
  sessionPL: number;
  total: number;
  matchCommission: number;
  sessionCommission: number;
  totalCommission: number;
  netAmount: number;
  shareAmount: number;
  grandTotal: number;
}

/**
 * Calculate commission and P/L for a set of bets (same as DisplayMatch.tsx)
 */
export const calculateCommission = (
  bets: Bet[],
  userShare: number = 100
): CommissionResult => {
  // Separate bet types
  const bookmakerBets = bets.filter(b => b.bet_type === "BOOKMAKER");
  const fancyBets = bets.filter(b => b.bet_type === "FANCY");

  // Get commission rates from first bet's immediate_child_admin
  const firstBet = bets[0];
  const admin = firstBet?.immediate_child_admin;
  
  const matchCommissionRate = admin?.match_commission || 0;
  const sessionCommissionRate = admin?.session_commission || 0;
  const sharePercentage = admin?.share || 0;
  const shareRate = sharePercentage / 100;

  // --------------- MATCH P/L ---------------
  const matchPL = bookmakerBets.reduce((acc: number, bet: Bet) => {
    const stake = Number(bet.stake_amount) || 0;
    const potential = Number(bet.potential_winnings) || 0;
    let value = 0;

    if (bet.status === "WON") {
      value = bet.selection === "Back" ? potential : stake;
    } else if (bet.status === "LOST") {
      value = bet.selection === "Back" ? -stake : -potential;
    }
    return acc + value;
  }, 0);

  // --------------- SESSION P/L ---------------
  const sessionPL = fancyBets.reduce((acc: number, bet: Bet) => {
    const stake = Number(bet.stake_amount) || 0;
    const potential = Number(bet.potential_winnings) || 0;
    let value = 0;

    if (bet.status === "WON") {
      value = bet.selection === "Yes" ? potential : stake;
    } else if (bet.status === "LOST") {
      value = bet.selection === "Yes" ? -stake : -potential;
    }
    return acc + value;
  }, 0);

  // DISPLAY INVERT (same as DisplayMatch.tsx)
  const invertedMatchPL = matchPL * -1;
  const invertedSessionPL = sessionPL * -1;
  const total = invertedMatchPL + invertedSessionPL;

  // --------------- COMMISSION ---------------
  
  // SESSION COMMISSION → ALWAYS
  const totalSessionStake = fancyBets.reduce(
    (acc: number, bet: Bet) => acc + (Number(bet.stake_amount) || 0),
    0
  );
  const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);

  // MATCH COMMISSION → ONLY IF MATCH PROFIT
  let matchCommission = 0;
  if (invertedMatchPL > 0) {
    matchCommission = invertedMatchPL * (matchCommissionRate / 100);
  }

  const totalCommission = matchCommission + sessionCommission;

  // --------------- SHARE CALCULATION ---------------
  const netAmount = total - totalCommission;
  const shareAmount = netAmount * shareRate;
  const grandTotal = netAmount - shareAmount;

  return {
    matchPL: invertedMatchPL,
    sessionPL: invertedSessionPL,
    total,
    matchCommission,
    sessionCommission,
    totalCommission,
    netAmount,
    shareAmount,
    grandTotal,
  };
};

/**
 * Calculate My Share P/L (CricketTableData.tsx के लिए)
 */
export const calculateMySharePL = (
  childNet: number,
  myLedgerNet: number
): number => childNet - myLedgerNet;

/**
 * Calculate client net amount for MyLedger
 */
export const calculateClientNetAmount = (clientBets: Bet[]): number => {
  const result = calculateCommission(clientBets);
  return result.grandTotal;
};