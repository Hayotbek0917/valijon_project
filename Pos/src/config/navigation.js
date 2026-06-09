import { ROLES } from './roles';

const OPS = [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER];
const FINANCE = [ROLES.ADMIN, ROLES.BOSS];
const ALL_EXCEPT_CASHIER = [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER];

/** Asosiy sidebar (yuqori qism) */
export const NAV_MAIN = [
  { path: '/', label: 'Dashboard', title: 'Dashboard', icon: 'dashboard', roles: ALL_EXCEPT_CASHIER },
  { path: '/pos', label: 'POS', title: 'POS (Kassa)', icon: 'pos', roles: [ROLES.CASHIER] },
  { path: '/products', label: 'Products', title: 'Mahsulotlar va qoldiq', icon: 'products', roles: [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER, ROLES.CASHIER] },
  { path: '/agents', label: 'Agentlar', title: 'Agentlar', icon: 'agents', roles: OPS },
];

/** Yig'iladigan guruhlar */
export const NAV_GROUPS = [
  {
    id: 'dilerlar',
    label: 'Dilerlar',
    icon: 'suppliers',
    roles: OPS,
    children: [
      { path: '/dilerlar/zakaz', label: 'Zakaz (Buyurtma)', title: 'Dilerlar — Zakaz', roles: OPS },
      { path: '/dilerlar/prixod', label: 'Prixod (Qabul)', title: 'Dilerlar — Prixod', roles: OPS },
    ],
  },
];

/** Sidebar pastki qism */
export const NAV_BOTTOM = [
  { path: '/ai-analytics', label: 'AI Analytica', title: 'AI Analytica', icon: 'ai-analytics', roles: FINANCE },
  { path: '/expire-management', label: 'Yaroqlilik Mudati', title: 'Yaroqlilik Mudati', icon: 'expire', roles: OPS },
  { path: '/reports', label: 'Hisobot', title: 'Hisobot', icon: 'reports', roles: ALL_EXCEPT_CASHIER },
  { path: '/staff', label: 'Xodimlar', title: 'Xodimlar', icon: 'staff', roles: [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER] },
  { path: '/settings', label: 'Sozlamalar', title: 'Sozlamalar', icon: 'settings', roles: [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER] },
];

export const NAV_LEGACY = [
  { path: '/suppliers', title: 'Dilerlar (eski)', roles: [ROLES.ADMIN] },
  { path: '/purchase-orders', title: 'Purchase Orders', roles: [ROLES.ADMIN] },
];

const titleByPath = new Map(
  [...NAV_MAIN, ...NAV_BOTTOM, ...NAV_LEGACY, ...NAV_GROUPS.flatMap((g) => g.children)].map(
    (item) => [item.path, item.title ?? item.label]
  )
);

export function getPageTitle(pathname) {
  return titleByPath.get(pathname) ?? 'POS';
}

export function isDilerlarPath(pathname) {
  return pathname.startsWith('/dilerlar');
}

export function filterByRole(items, role) {
  if (!role) return [];
  return items.filter((item) => item.roles?.includes(role));
}

export function filterGroupsByRole(groups, role) {
  return filterByRole(groups, role)
    .map((group) => ({
      ...group,
      children: filterByRole(group.children, role),
    }))
    .filter((group) => group.children.length > 0);
}
