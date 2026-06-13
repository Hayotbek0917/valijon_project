import { ROLES } from '../config/roles';

/** Demo foydalanuvchilar (frontend; backendda parol hash qilinadi) */
export const defaultUsers = [
  {
    id: 1,
    name: 'Adminstrator',
    username: 'admin',
    password: '123',
    role: ROLES.ADMIN,
    phone: '+998901234567',
    email: 'admin@market.uz',
    active: true,
  },
  {
    id: 2,
    name: 'Rustam Boss',
    username: 'boss',
    password: '123',
    role: ROLES.BOSS,
    phone: '+998901111111',
    email: 'boss@market.uz',
    active: true,
  },
  {
    id: 3,
    name: 'Dilshod Manager',
    username: 'manager',
    password: '123',
    role: ROLES.MANAGER,
    phone: '+998902222222',
    email: 'manager@market.uz',
    active: true,
  },
  {
    id: 4,
    name: 'Akmaljon Kassir',
    username: 'kassir',
    password: '123',
    role: ROLES.CASHIER,
    phone: '+998907654321',
    email: 'akmaljon@market.uz',
    active: true,
  },
];
