import { methodNotAllowed } from './_lib/auth.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return methodNotAllowed();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};
