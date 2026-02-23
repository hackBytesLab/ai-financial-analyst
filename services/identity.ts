import GoTrue from 'gotrue-js';

type IdentityUser = {
  id?: string;
  email?: string;
  jwt?: (forceRefresh?: boolean) => Promise<string>;
  logout?: () => Promise<void>;
};

type AuthListener = (user: IdentityUser | null) => void;

const runtimeOrigin = window.location.origin;
const siteBase = import.meta.env.VITE_NETLIFY_SITE_URL || runtimeOrigin;
const configuredIdentityUrl = import.meta.env.VITE_NETLIFY_IDENTITY_URL || `${siteBase}/.netlify/identity`;
const runtimeIdentityUrl = `${runtimeOrigin}/.netlify/identity`;
const identityCandidates = Array.from(
  new Set(
    [configuredIdentityUrl, runtimeIdentityUrl]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
  ),
);
const isDev = import.meta.env.DEV;
const LOCAL_DEV_USER_KEY = 'local-dev-auth-user';
const LOCAL_DEV_TOKEN_PREFIX = 'dev-local.';

let activeIdentityUrl = identityCandidates[0] || runtimeIdentityUrl;
let auth = new GoTrue({
  APIUrl: activeIdentityUrl,
  setCookie: true,
});

const listeners = new Set<AuthListener>();
let localDevUser: IdentityUser | null = restoreLocalDevUser();

function debugLog(message: string, payload?: unknown) {
  if (!isDev) return;
  if (payload === undefined) {
    console.info(`[auth] ${message}`);
    return;
  }
  console.info(`[auth] ${message}`, payload);
}

function buildAuthClient(apiUrl: string) {
  return new GoTrue({
    APIUrl: apiUrl,
    setCookie: true,
  });
}

function switchIdentityEndpoint(nextApiUrl: string) {
  if (!nextApiUrl || nextApiUrl === activeIdentityUrl) return;
  activeIdentityUrl = nextApiUrl;
  auth = buildAuthClient(nextApiUrl);
  debugLog('identity endpoint switched', { APIUrl: nextApiUrl });
}

function currentUser(): IdentityUser | null {
  if (localDevUser) {
    return localDevUser;
  }
  return auth.currentUser() as IdentityUser | null;
}

function notifyAuthChanged() {
  const user = currentUser();
  debugLog('auth state changed', user ? { userId: user.id, email: user.email } : { userId: null });
  listeners.forEach((listener) => listener(user));
}

async function getToken(): Promise<string> {
  const user = currentUser();
  if (!user || typeof user.jwt !== 'function') {
    return '';
  }
  return user.jwt();
}

function isLocalDevRuntime(): boolean {
  if (!isDev) return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildLocalDevToken(userId: string, email: string): string {
  const payload = JSON.stringify({ sub: userId, email });
  return `${LOCAL_DEV_TOKEN_PREFIX}${toBase64Url(payload)}`;
}

function restoreLocalDevUser(): IdentityUser | null {
  if (!isLocalDevRuntime()) return null;
  const raw = window.localStorage.getItem(LOCAL_DEV_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.id !== 'string' || typeof parsed.email !== 'string') return null;
    return createLocalDevUser(parsed.id, parsed.email);
  } catch {
    return null;
  }
}

function createLocalDevUser(userId: string, email: string): IdentityUser {
  return {
    id: userId,
    email,
    jwt: async () => buildLocalDevToken(userId, email),
    logout: async () => {
      window.localStorage.removeItem(LOCAL_DEV_USER_KEY);
      localDevUser = null;
      notifyAuthChanged();
    },
  };
}

function activateLocalDevUser(email: string): IdentityUser {
  const normalizedEmail = email.trim().toLowerCase();
  const safeId = normalizedEmail.replace(/[^a-z0-9@._-]/g, '_');
  const userId = `local-dev-${safeId || 'user'}`;
  window.localStorage.setItem(
    LOCAL_DEV_USER_KEY,
    JSON.stringify({ id: userId, email: normalizedEmail }),
  );
  localDevUser = createLocalDevUser(userId, normalizedEmail);
  notifyAuthChanged();
  debugLog('local dev auth activated', { email: normalizedEmail });
  return localDevUser;
}

function isIdentityTemporarilyUnavailable(error: unknown): boolean {
  const anyError = error as { status?: number; message?: string; json?: { error?: string } };
  const status = anyError?.status;
  const rawMessage = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : anyError?.message || '';
  const jsonError = anyError?.json?.error || '';
  const message = `${rawMessage} ${jsonError}`.toLowerCase();
  return status === 503
    || message.includes('service unavailable')
    || message.includes('failed to fetch')
    || message.includes('networkerror')
    || message.includes('cannot connect');
}

function isIdentityEndpointError(error: unknown): boolean {
  const anyError = error as { status?: number; message?: string; json?: { error?: string; error_description?: string } };
  const status = anyError?.status;
  const rawMessage = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : anyError?.message || '';
  const details = [rawMessage, anyError?.json?.error, anyError?.json?.error_description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return status === 404
    || details.includes('identity is not ready')
    || details.includes('identity not enabled')
    || details.includes('/.netlify/identity')
    || details.includes('gotrue');
}

function isEmailConfirmationRequired(error: unknown): boolean {
  const anyError = error as { message?: string; json?: { error?: string; error_description?: string } };
  const rawMessage = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : anyError?.message || '';
  const details = [rawMessage, anyError?.json?.error, anyError?.json?.error_description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return details.includes('email not confirmed')
    || details.includes('requires confirmation')
    || details.includes('confirm your email')
    || details.includes('verify your email');
}

async function runWithIdentityFallback<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const fallback = identityCandidates.find((url) => url !== activeIdentityUrl);
    if (!fallback || !isIdentityEndpointError(error)) {
      throw error;
    }
    debugLog('identity endpoint fallback triggered', {
      from: activeIdentityUrl,
      to: fallback,
      reason: String((error as Error)?.message || error),
    });
    switchIdentityEndpoint(fallback);
    return run();
  }
}

export const identity = {
  register: async (email: string, password: string) => {
    debugLog('register start', { email });
    try {
      await runWithIdentityFallback(() => auth.signup(email, password));
      let user: IdentityUser | null = null;
      try {
        user = await runWithIdentityFallback(() => auth.login(email, password, true));
      } catch (loginError) {
        if (!isEmailConfirmationRequired(loginError)) {
          throw loginError;
        }
        debugLog('register pending email confirmation', { email });
      }
      debugLog('register success', { email });
      notifyAuthChanged();
      return user;
    } catch (error) {
      if (isLocalDevRuntime() && (isIdentityTemporarilyUnavailable(error) || isIdentityEndpointError(error))) {
        return activateLocalDevUser(email);
      }
      // Signup may succeed while login requires email confirmation.
      notifyAuthChanged();
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    debugLog('login start', { email });
    try {
      const user = await runWithIdentityFallback(() => auth.login(email, password, true));
      debugLog('login success', { email });
      notifyAuthChanged();
      return user;
    } catch (error) {
      if (isLocalDevRuntime()) {
        debugLog('login fallback to local dev auth', {
          email,
          unavailable: isIdentityTemporarilyUnavailable(error),
          reason: String((error as Error)?.message || error),
        });
        return activateLocalDevUser(email);
      }
      throw error;
    }
  },

  logout: async () => {
    if (localDevUser) {
      window.localStorage.removeItem(LOCAL_DEV_USER_KEY);
      localDevUser = null;
      debugLog('logout local dev success');
      notifyAuthChanged();
      return;
    }
    const user = currentUser();
    if (user && typeof user.logout === 'function') {
      await user.logout();
    }
    debugLog('logout success');
    notifyAuthChanged();
  },

  currentUser,
  getToken,

  onChange: (callback: AuthListener) => {
    listeners.add(callback);
    callback(currentUser());

    return () => {
      listeners.delete(callback);
    };
  },
};
