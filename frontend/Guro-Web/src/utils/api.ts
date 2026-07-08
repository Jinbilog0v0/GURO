const TOKEN_KEY = 'guro_auth_token';

export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);
export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) ?? '';

export const apiFetch = (path: string, init?: RequestInit): Promise<Response> => {
  const token = getAuthToken();
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
};
