import { Transaction } from '../types';
import { getAuthToken } from './authStore';

const explicitApiBase = import.meta.env.VITE_API_BASE_URL;
const defaultApiBases = [
  `${window.location.protocol}//${window.location.hostname}:4000`,
  `${window.location.protocol}//${window.location.hostname}:4001`,
];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const bases = explicitApiBase ? [explicitApiBase] : defaultApiBases;
  let res: Response | null = null;
  let lastError: unknown = null;
  for (let i = 0; i < bases.length; i += 1) {
    const base = bases[i];
    try {
      const candidate = await fetch(`${base}${path}`, { ...options, headers });
      const shouldTryNext =
        !explicitApiBase &&
        i < bases.length - 1 &&
        path.startsWith('/api/') &&
        candidate.status === 404;
      if (shouldTryNext) {
        continue;
      }
      res = candidate;
      break;
    } catch (error) {
      lastError = error;
      if (explicitApiBase || i === bases.length - 1) {
        throw error;
      }
    }
  }
  if (!res) {
    throw (lastError instanceof Error ? lastError : new Error('Unable to connect to API'));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: { id: string; email: string; role?: string; lastLogin?: string | null } }>('/api/me'),
  adminListUsers: () => request<{ users: Array<{ id: string; email: string; createdAt: string; lastLogin?: string | null; role?: string }> }>('/api/admin/users'),
  listTransactions: () => request<{ transactions: Transaction[] }>('/api/transactions'),
  createTransaction: (payload: {
    type: 'income' | 'expense' | 'invest';
    amount: number;
    category: string;
    date: string;
    note?: string;
  }) =>
    request<{ transaction: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
