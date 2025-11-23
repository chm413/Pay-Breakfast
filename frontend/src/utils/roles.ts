const ADMIN_ROLE_CODES = ['ADMIN', 'MANAGER', 'SUPER_ADMIN', 'GRADE_ADMIN'];

export function isAdminRoleList(roles?: string[]) {
  if (!roles) return false;
  return roles.some((r) => ADMIN_ROLE_CODES.includes(r));
}

export const ADMIN_ROLE_OPTIONS = ADMIN_ROLE_CODES;
