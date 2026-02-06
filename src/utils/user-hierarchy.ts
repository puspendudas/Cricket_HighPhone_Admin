// src/utils/user-hierarchy.ts
import type { UserRole} from 'src/auth/types';

import { canAccessUserType } from 'src/auth/types';

export const filterUsersByHierarchy = (users: any[], currentUserRole: UserRole) => users.filter(user => canAccessUserType(currentUserRole, user.type));

export const getUserHierarchyLabel = (role: UserRole): string => {
  const labels = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    super_master: 'Super Master',
    master: 'Master',
    super_agent: 'Super Agent',
    agent: 'Agent'
  };
  
  return labels[role] || role;
};