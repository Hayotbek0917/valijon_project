import { apiRequest, setTokens, clearTokens } from './client';
import { mapUserFromApi } from './mappers';

const USER_KEY = 'pos_session_user';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export async function loginRequest({ phone, password }) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: phone.trim(), password }),
  });

  setTokens(data.access || data.access_token, data.refresh || data.refresh_token);
  const user = mapUserFromApi(data.user);
  storeUser(user);
  return user;
}

export function logoutRequest() {
  clearTokens();
  storeUser(null);
}

export async function createStaffUser(data) {
  const nameParts = (data.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const res = await apiRequest('/api/v1/users/create', {
    method: 'POST',
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      password: data.password,
      role: data.role,
      phone: data.phone || '',
    }),
  });
  return mapUserFromApi(res);
}

export async function validateSession() {
  await apiRequest('/api/v1/users?page_size=1');
  return getStoredUser();
}

export async function fetchStaffUsers() {
  const { fetchAll } = await import('./client');
  const rows = await fetchAll('/api/v1/users');
  return rows.map(mapUserFromApi);
}
