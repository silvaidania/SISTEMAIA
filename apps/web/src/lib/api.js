const tokenKey = 'sistemaia_token';
const userKey = 'sistemaia_user';
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function getStoredUser() {
  const raw = localStorage.getItem(userKey);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(userKey, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}

export async function api(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const url = apiBase ? `${apiBase}/api${path}` : `/api${path}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición');
  }

  return data;
}
