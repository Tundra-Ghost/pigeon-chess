export type User = { id: number; email: string; displayName: string };

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const LS_SERVER_URL = 'serverUrl';
export function getServerUrl(): string {
  return localStorage.getItem(LS_SERVER_URL) || 'http://localhost:8787';
}
export function setServerUrl(url: string) {
  localStorage.setItem(LS_SERVER_URL, url);
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const base = getServerUrl();
  const res = await fetch(base + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    let code = `HTTP_${res.status}`;
    try {
      const j = await res.json();
      if (typeof j?.error === 'string') code = j.error;
    } catch {}
    throw new ApiError(res.status, code);
  }
  return res.json();
}

export async function register(email: string, password: string, displayName: string): Promise<User> {
  const data = await api<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  return data.user;
}

export async function login(email: string, password: string): Promise<User> {
  const data = await api<{ user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function me(): Promise<User | null> {
  try {
    const data = await api<{ user: User }>('/api/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' });
}
