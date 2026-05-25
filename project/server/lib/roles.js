const ROLES = Object.freeze({
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  USER_MEMBER: 'User/Member',
});

const VALID_ROLES = Object.freeze(Object.values(ROLES));

function normalizeRole(role) {
  if (role === 'Student') return ROLES.USER_MEMBER;
  if (role === 'Librarian') return ROLES.MANAGER;
  return role || ROLES.USER_MEMBER;
}

function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

function isStaffRole(role) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.MANAGER;
}

module.exports = {
  ROLES,
  VALID_ROLES,
  normalizeRole,
  isValidRole,
  isStaffRole,
};
