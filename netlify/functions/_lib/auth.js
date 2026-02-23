function readBearerToken(event) {
  const raw = event?.headers?.authorization || event?.headers?.Authorization;
  if (!raw) return '';
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

function isLocalDevRuntime() {
  return process.env.NETLIFY_DEV === 'true';
}

function parseLocalDevToken(token) {
  if (!token || !token.startsWith('dev-local.')) {
    return null;
  }

  const encoded = token.slice('dev-local.'.length);
  if (!encoded) return null;

  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(decoded);
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    return {
      userId: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

function getSiteBaseUrl() {
  if (process.env.URL) return process.env.URL;
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL;
  return '';
}

export async function getAuthedUser(event, context) {
  const contextUser = context?.clientContext?.user;
  if (contextUser?.sub) {
    return {
      userId: contextUser.sub,
      email: contextUser.email || '',
    };
  }

  const token = readBearerToken(event);
  if (!token) {
    return null;
  }

  if (isLocalDevRuntime()) {
    const localUser = parseLocalDevToken(token);
    if (localUser) {
      return localUser;
    }
  }

  const baseUrl = getSiteBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const res = await fetch(`${baseUrl}/.netlify/identity/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const identityUser = await res.json();
    if (!identityUser?.sub) {
      return null;
    }

    return {
      userId: identityUser.sub,
      email: identityUser.email || '',
    };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'Unauthorized' }),
  };
}

export function methodNotAllowed() {
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
}
