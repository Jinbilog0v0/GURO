const TOKEN_KEY = 'guro_auth_token';

export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);
export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) ?? '';

export const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const token = getAuthToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearAuthToken();
    localStorage.removeItem('guro_user_session');
    window.dispatchEvent(new Event('guro_unauthorized'));
  }
  return res;
};
