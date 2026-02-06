import type { UserRole } from 'src/auth/types';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';
import { AuthGuard, RoleBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/Dashboard'));
const Adminview = lazy(() => import('src/pages/SuperAdmin/admin'));
const SuperMasterview = lazy(() => import('src/pages/SuperAdmin/superMaster'));
const Masterview = lazy(() => import('src/pages/SuperAdmin/master'));
const SuperAgentView = lazy(() => import('src/pages/SuperAdmin/superAgent'));
const AgentView = lazy(() => import('src/pages/SuperAdmin/agent'));
const ClientView = lazy(() => import('src/pages/SuperAdmin/client'));
const Cricketview = lazy(() => import('src/pages/sportBetting/cricket'));
const Casinoview = lazy(() => import('src/pages/sportBetting/casino'));
const AllPositions = lazy(() => import('src/pages/sportBetting/allPositions'));

const MatchSessionTable = lazy(() => import('src/sections/sportsBetting/All Positions/MatchSessionAction/MatchSessionTable'));
const DisplayMatch = lazy(() => import('src/sections/sportsBetting/Cricket/Display Match/displaymatch'));
const UnDeclaredMatch = lazy(() => import('src/sections/sportsBetting/Cricket/Display Match/UnDeclaredMatch/UnDeclaredMatch'));
const MatchsessionDisplay = lazy(() => import('src/sections/sportsBetting/All Positions/Display Match/displaySessionMatch'));
const MatchLiveData = lazy(() => import('src/sections/sportsBetting/MatchLiveData'));
const CricketMatchLiveData = lazy(() => import('src/sections/sportsBetting/Cricket/CricketMatchLiveData'));
const DeletedBets = lazy(() => import('src/sections/sportsBetting/Cricket/DeletedBets'));
const MatchCasinoData = lazy(() => import('src/sections/sportsBetting/Casino/MatchLiveData'));

const MyLedger = lazy(() => import('src/pages/ledger/ledger'));
const SuperAdmin = lazy(() => import('src/pages/ledger/allSuper'));
const TotalProfit = lazy(() => import('src/pages/ledger/totalprofit'));
const SuperAdminData = lazy(() => import('src/pages/ledger/superAdmin'));

const AdminReport = lazy(() => import('src/pages/allSuperAdminReport/adminReport'));

const Announcement = lazy(() => import('src/pages/settings/announcement'));

const MatchManagement = lazy(() => import('src/pages/matchmanagement/matchmanagement'));
const MatchManuallyUpdate = lazy(() => import('src/sections/matchmanagement/MatchManuallyUpdate'));
const SessionUpdate = lazy(() => import('src/sections/matchmanagement/SessionUpdate'));

const Lockedcasino = lazy(() => import('src/pages/lockedcasino/lockedcasino'));

type Props = {
  children: React.ReactNode;
  allowedRoles: UserRole[];
};

// ----------------------------------------------------------------------
export const RoleProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user } = useAuthContext();
  if (!user) return null;

  return (
    <RoleBasedGuard currentRole={user.type} acceptRoles={allowedRoles} hasContent>
      {children}
    </RoleBasedGuard>
  );
};

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: '/',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { path: 'dashboard', element: <IndexPage />, index: true },

      // ---------------- Master Routes ----------------
      {
        path: 'master',
        children: [
          {
            path: 'admin',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin']}>
                <Adminview />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'super-master',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <SuperMasterview />
              </RoleProtectedRoute>
            ),
          },
          {
            path: `super-master/:id`,
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <SuperMasterview />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'masters',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master']}>
                <Masterview />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'masters/:id',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master']}>
                <Masterview />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'super-agent',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master', 'master']}>
                <SuperAgentView />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'super-agent/:id',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master', 'master']}>
                <SuperAgentView />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agent',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master', 'master', 'super_agent']}>
                <AgentView />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'agent/:id',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master', 'master', 'super_agent']}>
                <AgentView />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'client',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master', 'master', 'super_agent', 'agent']}>
                <ClientView />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'client/:id',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'super_master', 'master', 'super_agent', 'agent']}>
                <ClientView />
              </RoleProtectedRoute>
            ),
          },
        ],
      },

      // ---------------- Sport Routes ----------------
      {
        path: 'sport',
        children: [
          { path: 'all-positions', element: <AllPositions /> },
          { path: 'cricket', element: <Cricketview /> },
          { path: 'casino', element: <Casinoview /> },
          { path: 'match-session', element: <MatchSessionTable /> },
          { path: '/sport/display-match/:gameId', element: <DisplayMatch /> },
          {
            path: '/sport/undeclared-match/:id',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin']}>
                <UnDeclaredMatch />
              </RoleProtectedRoute>
            ),
          },
          { path: 'display-match-session', element: <MatchsessionDisplay /> },
          { path: 'live-match-data', element: <MatchLiveData /> },
          { path: 'live-casino', element: <MatchCasinoData /> },
        ],
      },

      // ---------------- Ledger Routes ----------------
      {
        path: 'ledger',
        children: [
          { path: 'my-ledger', element: <MyLedger /> },
          { path: 'settlement', element: <SuperAdmin /> },
          { path: 'total-profit', element: <TotalProfit /> },
          { path: 'child_ledger', element: <SuperAdminData /> },
        ],
      },

      { path: 'all-super-admin-report', element: <AdminReport /> },

      // ---------------- Settings (Only Super Admin) ----------------
      {
        path: 'setting',
        children: [
          {
            path: 'announcement',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin']}>
                <Announcement />
              </RoleProtectedRoute>
            ),
          },
          {
            path: 'sync-used-wallet',
            element: (
              <RoleProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdmin />
              </RoleProtectedRoute>
            ),
          },
        ],
      },

      // ---------------- Match Management (Only Super Admin) ----------------
      {
        path: 'match-management',
        element: (
          <RoleProtectedRoute allowedRoles={['super_admin']}>
            <MatchManagement />
          </RoleProtectedRoute>
        ),
      },

      { path: 'match-manuall-update/:id', element: <MatchManuallyUpdate /> },
      { path: '/session-update/:id', element: <SessionUpdate /> },
      { path: 'locked-casino', element: <Lockedcasino /> },
      { path: '/cricket-live-match-data/:gameId', element: <CricketMatchLiveData /> },
      { path: '/deleted-bets/:gameId', element: <DeletedBets /> },
    ],
  },
];
