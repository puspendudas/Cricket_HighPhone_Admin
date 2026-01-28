export type UserRole = 'super_admin' | 'admin' | 'super_master' | 'master' | 'super_agent' | 'agent' ;

export type UserType = {
  _id: string;
  user_name: string;
  mobile: string;
  status: boolean;
  type: UserRole;
  accessToken?: string;
} | null;

export type AuthState = {
  user: UserType;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};

// User hierarchy
export const USER_HIERARCHY: Record<UserRole, number> = {
  super_admin: 6,
  admin: 5,
  super_master: 4,
  master: 3,
  super_agent: 2,
  agent: 1
};

// Check access by hierarchy
export const canAccessUserType = (currentUserRole: UserRole, targetUserRole: UserRole): boolean =>
  USER_HIERARCHY[currentUserRole] >= USER_HIERARCHY[targetUserRole];


// Get all roles below current role (including self)
export const getAccessibleRoles = (currentUserRole: UserRole, includeSelf = true): UserRole[] => {
  const currentLevel = USER_HIERARCHY[currentUserRole];
  const roles = Object.entries(USER_HIERARCHY)
    .filter(([_, level]) => level <= currentLevel)
    .map(([role]) => role as UserRole);

  return includeSelf ? roles : roles.filter(r => r !== currentUserRole);
};
