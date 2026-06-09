export const ROLES = {
  ADMIN: 'admin',
  BOSS: 'boss',
  MANAGER: 'manager',
  CASHIER: 'cashier',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Tizim Administratori',
  [ROLES.BOSS]: 'Biznes Egasi (Boss)',
  [ROLES.MANAGER]: 'Boshqaruvchi (Manager)',
  [ROLES.CASHIER]: 'Kassir',
};

const OPS_STAFF = [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER];
const FINANCE_STAFF = [ROLES.ADMIN, ROLES.BOSS];

/** Marshrut → ruxsat berilgan rollar */
export const ROUTE_ROLES = {
  '/': OPS_STAFF,
  '/pos': [ROLES.CASHIER],
  '/products': [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER, ROLES.CASHIER],
  '/agents': OPS_STAFF,
  '/dilerlar/zakaz': OPS_STAFF,
  '/dilerlar/prixod': OPS_STAFF,
  '/suppliers': [ROLES.ADMIN],
  '/purchase-orders': [ROLES.ADMIN],
  '/ai-analytics': FINANCE_STAFF,
  '/expire-management': OPS_STAFF,
  '/reports': OPS_STAFF,
  '/staff': [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER],
  '/settings': [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER],
};

export function canAccessRoute(role, pathname) {
  if (!role) return false;
  const allowed = ROUTE_ROLES[pathname];
  if (allowed) return allowed.includes(role);
  if (pathname.startsWith('/dilerlar')) {
    return ROUTE_ROLES['/dilerlar/zakaz'].includes(role);
  }
  return false;
}

export function getHomePath(role) {
  if (role === ROLES.CASHIER) return '/pos';
  return '/';
}

export function hasRole(user, role) {
  return user?.role === role;
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

export function isBoss(user) {
  return hasRole(user, ROLES.BOSS);
}

export function canManageSystem(user) {
  return isAdmin(user);
}
