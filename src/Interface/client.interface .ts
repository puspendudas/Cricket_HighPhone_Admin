// src/Interface/admin.interface.ts

export interface Member {
  betting: boolean | undefined;
  exposure: number;
  parentWallet: number;
  parent_id: any;
  wallet: number;
  agentName: string;
  id: number;
  user: string;
  name: string;
  _id: string;
  password: string;
  admin: string;
  superAdmin: string;
  currentBal: string;
  AgentWallet: string;
  match: string;
  session: string;
  casino: string;
  code: string;
  status: string;
  share: number;
  matchCommission: number;
  sessionCommission: number;
  casinoCommission: number;
}

export interface MemberFormData {
  share: unknown;
  code: string;
  name: string;
  password: string;
  // mobile: string;
  status: any
  matchCommission: number;
  sessionCommission: number;
  casinoCommission: number;
  wallet: number;
  exposure: number;
  agent_id?: string;
}

export interface AdminApiPayload {
  user_name: string;
  name: string;
  password: string;
  // mobile: string;
  type: string;
  share: number;
  match_commission: number;
  session_commission: number;
  casino_commission: number;
  wallet: number;
  exposure: number;
  agent_id: string | undefined;
  status: boolean
}
export interface Updatepaylod {
  name: string;
  password: string;
  share: number;
  // mobile: string;
  match_commission: number;
  session_commission: number;
  casino_commission: number;
  agent_id: string | undefined;
  status: boolean
}