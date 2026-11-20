const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API = `${API_ORIGIN}/api`;

export async function request(path, options = {}) {
  const token = localStorage.getItem('kc_token');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'The request could not be completed.');
  return data;
}

export const json = (method, body) => ({ method, body: JSON.stringify(body) });
