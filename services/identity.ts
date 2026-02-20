import GoTrue from 'gotrue-js';

type IdentityUser = {
  id?: string;
  email?: string;
  jwt?: (forceRefresh?: boolean) => Promise<string>;
  logout?: () => Promise<void>;
};

type AuthListener = (user: IdentityUser | null) => void;

const siteBase = import.meta.env.VITE_NETLIFY_SITE_URL || window.location.origin;
const identityUrl = import.meta.env.VITE_NETLIFY_IDENTITY_URL || `${siteBase}/.netlify/identity`;
const isDev = import.meta.env.DEV;

const auth = new GoTrue({
  APIUrl: identityUrl,
  setCookie: true,
});

const listeners = new Set<AuthListener>();

function debugLog(message: string, payload?: unknown) {
  if (!isDev) return;
  if (payload === undefined) {
    console.info(`[auth] ${message}`);
    return;
  }
  console.info(`[auth] ${message}`, payload);
}

function currentUser(): IdentityUser | null {
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

export const identity = {
  register: async (email: string, password: string) => {
    debugLog('register start', { email });
    await auth.signup(email, password);
    try {
      const user = await auth.login(email, password, true);
      debugLog('register success', { email });
      notifyAuthChanged();
      return user;
    } catch (error) {
      // Signup may succeed while login requires email confirmation.
      notifyAuthChanged();
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    debugLog('login start', { email });
    const user = await auth.login(email, password, true);
    debugLog('login success', { email });
    notifyAuthChanged();
    return user;
  },

  logout: async () => {
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
