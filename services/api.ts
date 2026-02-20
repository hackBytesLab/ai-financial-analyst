import { Transaction, TransactionInput, User } from '../types';
import { identity } from './identity';

const siteBase = import.meta.env.VITE_NETLIFY_SITE_URL || window.location.origin;
const functionsBase = `${siteBase}/.netlify/functions`;
const isDev = import.meta.env.DEV;

type ApiOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  auth?: boolean;
};

function normalizeApiError(path: string, status: number, body: { error?: string; code?: string }): string {
  if (path === '/transactions' && (status === 503 || body?.code === 'TX_STORE_UNAVAILABLE')) {
    return 'Transactions temporarily unavailable';
  }
  return body?.error || `Request failed: ${status}`;
}

function debugLog(message: string, payload?: unknown) {
  if (!isDev) return;
  if (payload === undefined) {
    console.info(`[api] ${message}`);
    return;
  }
  console.info(`[api] ${message}`, payload);
}

export function normalizeAuthError(error: unknown): string {
  const fallback = 'Auth request failed';
  if (!error) return fallback;

  const anyError = error as {
    status?: number;
    message?: string;
    json?: { error?: string; error_description?: string; msg?: string };
  };
  const jsonMessage = [anyError?.json?.error, anyError?.json?.error_description, anyError?.json?.msg]
    .filter(Boolean)
    .join(': ');
  const rawMessage = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : anyError?.message || '';
  const message = rawMessage || jsonMessage || (anyError?.status ? `HTTP ${anyError.status}` : String(error));
  const lower = message.toLowerCase();
  const status = anyError?.status;

  if (status === 404 || lower.includes('identity is not ready') || lower.includes('identity not enabled') || lower.includes('not found') || lower.includes('404')) {
    return 'Identity not enabled';
  }
  if (lower.includes('email') && lower.includes('confirm')) {
    return 'Email not confirmed';
  }
  if (lower.includes('invalid') && (lower.includes('credential') || lower.includes('password') || lower.includes('login'))) {
    return 'Invalid login credentials';
  }
  if (lower.includes('unauthorized') || lower.includes('401')) {
    return 'Invalid login credentials';
  }

  return message || fallback;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.auth !== false) {
    const token = await identity.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${functionsBase}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = normalizeApiError(path, res.status, body);
    if (isDev) {
      debugLog('request fail', { path, status: res.status, code: body?.code, error: body?.error });
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  onAuthChange: (callback: (user: unknown | null) => void) => identity.onChange(callback),

  register: async (email: string, password: string): Promise<{ token: string }> => {
    debugLog('register request start', { email });
    try {
      await identity.register(email, password);
      const token = await identity.getToken();
      debugLog('register request success', { email });
      return { token };
    } catch (error) {
      debugLog('register request fail', { email, error });
      throw new Error(normalizeAuthError(error));
    }
  },

  login: async (email: string, password: string): Promise<{ token: string }> => {
    debugLog('login request start', { email });
    try {
      await identity.login(email, password);
      const token = await identity.getToken();
      debugLog('login request success', { email });
      return { token };
    } catch (error) {
      debugLog('login request fail', { email, error });
      throw new Error(normalizeAuthError(error));
    }
  },

  logout: async (): Promise<void> => {
    identity.logout();
    await request<{ ok: true }>('/logout', { method: 'POST', auth: false }).catch(() => ({ ok: true }));
  },

  me: (): Promise<{ user: User }> => request('/me'),

  adminListUsers: async (): Promise<{ users: Array<{ id: string; email: string; createdAt: string; lastLogin?: string | null; role?: string }> }> => {
    throw new Error('Admin module disabled in Netlify-only mode');
  },

  listTransactions: (): Promise<{ transactions: Transaction[] }> => request('/transactions'),

  createTransaction: (payload: TransactionInput): Promise<{ transaction: Transaction }> =>
    request('/transactions', {
      method: 'POST',
      body: payload,
    }),
};
