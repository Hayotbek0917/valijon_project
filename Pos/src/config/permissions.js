import { ROLES } from './roles';

/** Rol bo'yicha funksional huquqlar */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    viewProfit: true,
    viewNetProfitReports: true,
    editProducts: true,
    viewProductCost: true,
    viewStaff: true,
    manageUsers: true,
    systemSettings: true,
    viewMarketReadOnly: false,
  },
  [ROLES.BOSS]: {
    viewProfit: true,
    viewNetProfitReports: true,
    editProducts: true,
    viewProductCost: true,
    viewStaff: true,
    manageUsers: true,
    systemSettings: false,
    viewMarketReadOnly: true,
  },
  [ROLES.MANAGER]: {
    viewProfit: false,
    viewNetProfitReports: false,
    editProducts: true,
    viewProductCost: true,
    viewStaff: true,
    manageUsers: false,
    systemSettings: false,
    viewMarketReadOnly: false,
  },
  [ROLES.CASHIER]: {
    viewProfit: false,
    viewNetProfitReports: false,
    editProducts: false,
    viewProductCost: false,
    viewStaff: false,
    manageUsers: false,
    systemSettings: false,
    viewMarketReadOnly: false,
  },
};

export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS[ROLES.CASHIER];
}

export function canViewProfit(role) {
  return getPermissions(role).viewProfit;
}

export function canEditProducts(role) {
  return getPermissions(role).editProducts;
}

export function canManageUsers(role) {
  return getPermissions(role).manageUsers;
}
