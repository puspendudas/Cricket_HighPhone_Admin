// src/routes/paths.ts

// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',

  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },

  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,

    master: {
      admin: `/master/admin`,
      
      miniadmin: `/master/super-master`,
      miniadminChild: `/master/super-master/:id`,

      masters: `/master/masters`,
      mastersChild: `/master/masters/:id`,

      superagent: `/master/super-agent`,
      superagentChild: `/master/super-agent/:id`,

      agent: `/master/agent`,
      agentChild: `/master/agent/:id`,

      client: `/master/client`,
      clientChild: `/master/client/:id`,
    },

    Sport: {
      allpositions: `/sport/all-positions`,
      cricket: `/sport/cricket`,
      casino: `/sport/casino`,
      matchsession: `/sport/match-session`,
      displaymatch: `/sport/display-match`,
      displaymatchsession: `/sport/display-match-session`,
      livematch: `/sport/live-match-data`,
      cricketlivematch: `/sport/cricket-live-match-data/:gameId`,
      deletedBets: `/sport/deleted-bets/:gameId`,
      livecasino: `/sport/live-casino`,
      // undeclaredmatch: `/sport/undeclared-match/:id`, // define if used in routes
    },

    ledger: {
      myledger: `/ledger/my-ledger`,
      allsuperadmin: `/ledger/settlement`,
      totalprofit: `/ledger/total-profit`,
      superadmindata: `/ledger/child_ledger`,
    },

    adminreport: `/all-super-admin-report`,

    setting: {
      announcement: `/setting/announcement`,
      syncusedwallet: `/setting/sync-used-wallet`,
    },

    matchmanagement: `/match-management`,
    matchupdate: `/match-manuall-update/:id`,
    sessionupdate: `/session-update/:id`,
    lockedcasino: `/locked-casino`,

    // FIX: removed duplicate/invalid cricketlivematch at root level
  },
};
