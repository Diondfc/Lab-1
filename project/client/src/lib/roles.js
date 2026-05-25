export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  USER_MEMBER: 'User/Member',
}

export function normalizeRole(role) {
  if (role === 'Student') return ROLES.USER_MEMBER;
  if (role === 'Librarian') return ROLES.MANAGER;
  return role || ROLES.USER_MEMBER;
}

export function isStaffRole(role) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.MANAGER;
}
