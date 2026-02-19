import { Transaction } from '../types';
import { getAuthToken } from './authStore';

const defaultApiBase = `${window.location.protocol}//${window.location.hostname}:4000`;
const API_BASE = import.meta.env.VITE_API_BASE_URL || defaultApiBase;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
