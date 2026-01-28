import { BASE_URL } from '../BaseURL/BaseURL';

export const Endpoints = {

    me: `${BASE_URL}/admin/me`,
    superadmin: `${BASE_URL}/admin`,
    fetchAllMatch: `${BASE_URL}/match/all`,
    updateStatus: `${BASE_URL}/match/toggle`,
    FatchUpdateMatchData: `${BASE_URL}/match`,
    updateStatusSession: `${BASE_URL}/match/togglesession`,
    useBetHistroy: `${BASE_URL}/match-bets/match`,
    fetchTableData: `${BASE_URL}/match/admin/all/declared/true`,
    fetchTotalData: `${BASE_URL}/match/admin/all/total`,
    Settlement: `${BASE_URL}/admin/settlement`,
    Exposure: `${BASE_URL}/match/admin/exposure`,
    FatchUpdateData: `${BASE_URL}/match/odds/fancy`,
    DeclareMatch: `${BASE_URL}/match-bets/settle/bookmacker`,
    DeclareFancyMatch: `${BASE_URL}/match-bets/settle/fancy`,
    CancelMatch: `${BASE_URL}/match-bets/cancel/bookmacker`,
    CancelFancyMatch: `${BASE_URL}/match-bets/cancel/fancy`,
    CancelSingleBetMatch: `${BASE_URL}/match-bets/cancel/single`,
    FancyRollBack: `${BASE_URL}/match-bets/rollback/fancy`,
    MatchRollBack: `${BASE_URL}/match-bets/rollback/bookmacker`,
    Dashboard: `${BASE_URL}/admin/dashboard`,
    Deactivate: `${BASE_URL}/admin/toggle/statusAll`,
    limits: `${BASE_URL}/admin`,
    FatchLimitData: `${BASE_URL}/admin/users`,
    Announcement: `${BASE_URL}/admin/announcement`,
    BetLock: `${BASE_URL}/admin/users`,
    Matchdelay: `${BASE_URL}/match/delay`,
    updateStatusMInMax: `${BASE_URL}/match/session/limit`,



}



