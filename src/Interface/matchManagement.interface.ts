export interface Match {
  declared: any;
  _id: string;
  gameId: string;
  eventName: string;
  eventTime: string;
  status: boolean
  wonby: string | null;

}


export interface OddData {
  sid: number;
  b1: string;
  bs1: string;
  l1: string;
  ls1: string;
  rname: string;
  status?: string;
}

export interface MarketData {
    isActive: boolean;
    _id: number;
    bs1: number;
    b1: number;
    ls1: number;
    l1: number;
    status: string;
    rname: string;
    mid: string;
    market: string;
    oddDatas: OddData[];
}


export interface BetData {
    id: string;
    user: {
        _id: string;
        user_name: string;
        name: string;
        status: boolean;
    };
    match: {
        _id: string;
        gameId: string;
        marketId: string;
        eventId: string;
        eventName: string;
        eventTime: string;
        inPlay: boolean;
        seriesName: string;
        status: boolean;
        declared: boolean;
        wonby: string | null;
    };
    bet_type: string;
    selection: string;
    selection_id: number;
    odds_rate: string;
    stake_amount: number;
    potential_winnings: number;
    status: string;
    result: string | null;
    settled_at: string | null;
    team_name: string | null;
    session_name: string | null;
    runner_name: string | null;
    game_id: string;
    event_id: string;
    createdAt: string;
    updatedAt: string;
}