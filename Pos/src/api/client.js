const API_BASE = import.meta.env.VITE_API_URL || '';

const ACCESS_KEY = 'pos_access_token';
const REFRESH_KEY = 'pos_refresh_token';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('pos_session_user');
}

function parseErrorMessage(data) {
  if (!data) return "So'rov bajarilmadi";
  if (typeof data === 'string') return data;
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  if (Array.isArray(data.messages)) {
    const msg = data.messages.find((m) => m?.message);
    if (msg?.message) return String(msg.message);
  }
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    if (Array.isArray(val)) return String(val[0]);
    return String(val);
  }
  return "So'rov bajarilmadi";
}

function isAuthError(status, data) {
  if (status === 401) return true;
  if (status !== 403) return false;
  const code = data?.code;
  const detail = String(data?.detail || '').toLowerCase();
  return (
    code === 'token_not_valid'
    || detail.includes('token')
    || detail.includes('authentication')
    || detail.includes('user not found')
  );
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  const res = await fetch(`${API_BASE}/api/v1/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return false;
  }

  const data = await res.json();
  setTokens(data.access, refresh);
  return true;
}

function resolvePath(url) {
  if (!url) return null;
  if (url.startsWith('http')) {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  }
  return url;
}

export async function apiRequest(path, options = {}, retry = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }

  const data = await res.json().catch(() => ({}));

  if (
    isAuthError(res.status, data)
    && retry
    && getRefreshToken()
    && !path.includes('/auth/login')
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest(path, options, false);
    clearTokens();
  } else if (isAuthError(res.status, data)) {
    clearTokens();
  }

  throw new ApiError(parseErrorMessage(data), res.status, data);
}

export async function fetchAll(path) {
  let url = path;
  const items = [];

  while (url) {
    const data = await apiRequest(url);
    if (Array.isArray(data)) return data;
    items.push(...(data.results || []));
    url = resolvePath(data.next);
  }

  return items;
}
