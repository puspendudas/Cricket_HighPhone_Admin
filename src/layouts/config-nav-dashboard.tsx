// src/layouts/dashboard/config-nav-dashboard.tsx
import type { UserRole } from 'src/auth/types';

import React from 'react';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

import { useAuthContext } from 'src/auth/hooks';

import { Iconify } from '../components/iconify';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  user: icon('ic-user'),
  masters: <Iconify icon="material-symbols:menu" />,
  admin: <Iconify icon="mdi:account" />,
  Sport: <Iconify icon="material-symbols:sports-volleyball" />,
  ledger: <Iconify icon="material-symbols:lab-profile-sharp" />,
  attendance: <Iconify icon="fluent-mdl2:date-time" />,
  game: <Iconify icon="material-symbols:videogame-asset-outline-sharp" />,
  lock: <Iconify icon="material-symbols:lock-outline-sharp" />,
  permission: <Iconify icon="fluent-mdl2:permissions-solid" />,
  dashboard: icon('ic-dashboard'),
  training: <Iconify icon="healthicons:i-training-class-24px" />,
  data: <Iconify icon="material-symbols:database" />,
  setting: <Iconify icon="solar:settings-bold-duotone" />,
  notification: <Iconify icon="mdi:bell-notification" />,
};

// ----------------------------------------------------------------------
// Types
export interface NavItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

// ----------------------------------------------------------------------
// Role-based navigation helpers

export const USER_HIERARCHY: Record<UserRole, number> = {
  super_admin: 6,
  admin: 5,
  super_master: 4,
  master: 3,
  super_agent: 2,
  agent: 1,
};

// Map each role to a menu item (label + path)
const ROLE_TO_ITEM: Record<UserRole, NavItem> = {
  super_admin: { title: 'Admin', path: paths.dashboard.master.admin },
  admin: { title: 'Admin', path: paths.dashboard.master.admin },
  super_master: { title: 'Super Master', path: paths.dashboard.master.miniadmin },
  master: { title: 'Master', path: paths.dashboard.master.masters },
  super_agent: { title: 'Super Agent', path: paths.dashboard.master.superagent },
  agent: { title: 'Agent', path: paths.dashboard.master.agent }, // requires paths fix
};

// Get roles below current (optionally excluding self)
export const getAccessibleRoles = (currentUserRole: UserRole, includeSelf = true): UserRole[] => {
  const currentLevel = USER_HIERARCHY[currentUserRole];
  const roles = Object.entries(USER_HIERARCHY)
    .filter(([_, level]) => level <= currentLevel)
    .map(([role]) => role as UserRole);

  return includeSelf ? roles : roles.filter((r) => r !== currentUserRole);
};

// Build role-based nav children
const getRoleBasedNavItems = (currentRole: UserRole): NavItem[] => {
  // Agent users manage only clients
  if (currentRole === 'agent') {
    return [{ title: 'Client', path: paths.dashboard.master.client }];
  }

  const accessibleRoles = getAccessibleRoles(currentRole, false);
  const items: NavItem[] = [];

  accessibleRoles.forEach((role) => {
    const mapped = ROLE_TO_ITEM[role];
    if (mapped) items.push(mapped);
  });

  // Always let higher roles see Client management page
  if (accessibleRoles.includes('agent')) {
    items.push({ title: 'Client', path: paths.dashboard.master.client });
  }

  return items;
};

// ----------------------------------------------------------------------
export const useNavData = (): { subheader?: string; items: NavItem[] }[] => {
  const { user } = useAuthContext();
  const currentRole = (user?.type || 'agent') as UserRole;

  const navData: { subheader?: string; items: NavItem[] }[] = [
    {
      subheader: '',
      items: [{ title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard }],
    },
  ];

  // User Management
  const userManagementItems = getRoleBasedNavItems(currentRole);
  if (userManagementItems.length > 0) {
    navData.push({
      items: [
        {
          title: 'User Management',
          path: paths.dashboard.master.admin,
          icon: ICONS.masters,
          children: userManagementItems,
        },
      ],
    });
  }

  // Sports Betting
  navData.push({
    items: [
      {
        title: "Sport's Betting",
        path: paths.dashboard.Sport.allpositions,
        icon: ICONS.Sport,
        children: [
          // { title: 'All Positions', path: paths.dashboard.Sport.allpositions },
          { title: 'Cricket', path: paths.dashboard.Sport.cricket },
          // { title: 'Casino', path: paths.dashboard.Sport.casino },
        ],
      },
    ],
  });

  // Ledger
  navData.push({
    items: [
      {
        title: 'Ledger',
        path: paths.dashboard.ledger.myledger,
        icon: ICONS.ledger,
        children: [
          { title: 'Settlement', path: paths.dashboard.ledger.allsuperadmin },
          { title: 'Child Ledger', path: paths.dashboard.ledger.superadmindata },
          ...(currentRole !== 'super_admin'
            ? [
              { title: 'My Ledger', path: paths.dashboard.ledger.myledger },
              { title: 'Total Profit', path: paths.dashboard.ledger.totalprofit },

            ]
            : []),
        ],
      },
    ],
  });

  // All Super Admin Report (visible to all as per original)
  navData.push({
    items: [
      {
        title: 'All Child Report',
        path: paths.dashboard.adminreport,
        icon: ICONS.admin,
      },
    ],
  });

  // Super Admin only
  if (currentRole === 'super_admin') {
    navData.push({
      items: [
        {
          title: 'Setting',
          path: paths.dashboard.setting.announcement,
          icon: ICONS.setting,
          children: [
            { title: 'Announcement', path: paths.dashboard.setting.announcement },
            { title: 'Sync Used Wallet', path: paths.dashboard.setting.syncusedwallet },
          ],
        },
      ],
    });

    navData.push({
      items: [
        {
          title: 'Match Management',
          path: paths.dashboard.matchmanagement,
          icon: ICONS.game,
        },
      ],
    });
  }

  // Locked Casino (visible to all)
  navData.push({
    items: [
      {
        title: 'Extra Casino',
        path: paths.dashboard.lockedcasino,
        icon: ICONS.lock,
      },
    ],
  });

  // Old Data - super_admin only (example static months)
  if (currentRole === 'super_admin') {
    navData.push({
      items: [
        {
          title: 'Old Data',
          path: paths.dashboard.ledger.myledger,
          icon: ICONS.data,
          children: [
            { title: 'Apr 2025', path: paths.dashboard.ledger.myledger },
            { title: 'Feb 2025', path: paths.dashboard.ledger.allsuperadmin },
          ],
        },
      ],
    });
  }

  return navData;
};
