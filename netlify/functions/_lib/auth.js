function readBearerToken(event) {
  const raw = event?.headers?.authorization || event?.headers?.Authorization;
  if (!raw) return '';
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

function getSiteBaseUrl(event) {
  if (process.env.URL) return process.env.URL;
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL;
  const host = event?.headers?.host;
  return host ? `https://${host}` : '';
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

  const baseUrl = getSiteBaseUrl(event);
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
