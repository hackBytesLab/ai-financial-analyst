import { getAuthedUser, methodNotAllowed, unauthorized } from './_lib/auth.js';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return methodNotAllowed();
  }

  const authed = await getAuthedUser(event, context);
  if (!authed) {
    return unauthorized();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      user: {
        id: authed.userId,
        email: authed.email,
        role: 'USER',
        lastLogin: null,
      },
    }),
  };
};
