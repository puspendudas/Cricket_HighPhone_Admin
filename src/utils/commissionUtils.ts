// src/utils/commissionUtils.ts

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
  clientSummaries: any[]
): CommissionResult => {
  if (!clientSummaries || clientSummaries.length === 0) {
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

  const admin = clientSummaries[0]?.immediate_child_admin;
  const matchCommissionRate = admin?.match_commission || 0;
  const sessionCommissionRate = admin?.session_commission || 0;
  const shareRate = (admin?.share || 0) / 100;

  let matchPL = 0;
  let sessionPL = 0;
  let totalSessionStake = 0;
  let matchCommission = 0;

  clientSummaries.forEach((c: any) => {
    matchPL += c.client_net_match_pl || 0;
    sessionPL += c.client_net_session_pl || 0;
    totalSessionStake += c.client_total_session_stake || 0;

    const clientMatchPL = c.client_net_match_pl || 0;
    if (clientMatchPL < 0) {
      matchCommission += Math.abs(clientMatchPL) * (matchCommissionRate / 100);
    }
  });

  // ADMIN VIEW INVERTS
  const invertedMatchPL = matchPL * -1;
  const invertedSessionPL = sessionPL * -1;
  const total = invertedMatchPL + invertedSessionPL;

  const sessionCommission = totalSessionStake * (sessionCommissionRate / 100);
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
  clientSummaries: any[]
): number => calculateCommission(clientSummaries).grandTotal;

