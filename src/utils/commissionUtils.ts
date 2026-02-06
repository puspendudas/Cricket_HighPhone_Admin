// src/utils/commissionUtils.ts

export interface Bet {
  bet_type: string;
  selection: string;
  status: string;
  stake_amount: string | number;
  potential_winnings: string | number;
  user_id?: string;
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
 * ✅ SAME LOGIC AS DisplayMatch.tsx (FINAL)
 */
export const calculateCommission = (
  bets: Bet[],
  match?: any
): CommissionResult => {
  if (!bets || bets.length === 0) {
    return {
      matchPL: 0,
      sessionPL: 0,
      total: 0,
      matchCommission: 0,
      sessionCommission: 0,
      totalCommission: 0,
      netAmount: 0,
      shareAmount: 0,
      grandTotal: 0,
    };
  }

  const bookmakerBets = bets.filter(b => b.bet_type === "BOOKMAKER");
  const fancyBets = bets.filter(b => b.bet_type === "FANCY");

  const admin = bets[0]?.immediate_child_admin;
  const matchCommissionRate = admin?.match_commission || 0;
  const sessionCommissionRate = admin?.session_commission || 0;
  const shareRate = (admin?.share || 0) / 100;

  // ---------------- BET VALUE ----------------
  const calcValue = (bet: Bet) => {
    const stake = Number(bet.stake_amount) || 0;
    const potential = Number(bet.potential_winnings) || 0;

    if (bet.status === "WON") {
      if (bet.selection === "Back" || bet.selection === "Yes") return potential;
      if (bet.selection === "Lay" || bet.selection === "Not") return stake;
    }

    if (bet.status === "LOST") {
      if (bet.selection === "Back" || bet.selection === "Yes") return -stake;
      if (bet.selection === "Lay" || bet.selection === "Not") return -potential;
    }
    return 0;
  };

  // ---------------- P/L ----------------
  const matchPL = bookmakerBets.reduce((a, b) => a + calcValue(b), 0);
  const sessionPL = fancyBets.reduce((a, b) => a + calcValue(b), 0);

  // ADMIN VIEW
  const invertedMatchPL = matchPL * -1;
  const invertedSessionPL = sessionPL * -1;
  const total = invertedMatchPL + invertedSessionPL;

  // ---------------- SESSION COMMISSION (ALWAYS) ----------------
  const totalSessionStake = fancyBets.reduce(
    (a, b) => a + (Number(b.stake_amount) || 0),
    0
  );
  const sessionCommission =
    totalSessionStake * (sessionCommissionRate / 100);

  // ---------------- ✅ MATCH COMMISSION (ONLY CLIENT LOSS) ----------------
  let matchCommission = 0;
  const summaries = match?.client_summary || [];

  summaries.forEach((c: any) => {
    const belongs = bets.some(b => b.user_id === c.client_id);
    if (!belongs) return;

    if (c.client_net_match_pl < 0) {
      matchCommission +=
        Math.abs(c.client_net_match_pl) * (matchCommissionRate / 100);
    }
  });

  const totalCommission = matchCommission + sessionCommission;

  // ---------------- FINAL ----------------
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
 * My Share P/L
 */
export const calculateMySharePL = (
  childNet: number,
  myLedgerNet: number
): number => childNet - myLedgerNet;

/**
 * Client net amount (MyLedger / TotalProfit / CricketTable)
 */
export const calculateClientNetAmount = (
  clientBets: Bet[],
  match?: any
): number =>
  calculateCommission(clientBets, match).grandTotal;

