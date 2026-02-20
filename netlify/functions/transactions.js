import { createTransactionForUser, listTransactionsByUser } from './_lib/store.js';
import { getAuthedUser, methodNotAllowed, unauthorized } from './_lib/auth.js';

function badRequest(message) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: message }),
  };
}

function parseBody(body) {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return null;
  }
}

function validatePayload(payload) {
  const validType = payload?.type === 'income' || payload?.type === 'expense' || payload?.type === 'invest';
  if (!validType) return 'Invalid type';
  if (typeof payload?.amount !== 'number' || !Number.isFinite(payload.amount) || payload.amount <= 0) return 'Invalid amount';
  if (typeof payload?.category !== 'string' || payload.category.trim().length === 0) return 'Invalid category';
  if (typeof payload?.date !== 'string' || payload.date.trim().length === 0) return 'Invalid date';
  if (payload?.note != null && typeof payload.note !== 'string') return 'Invalid note';
  return null;
}

export const handler = async (event, context) => {
  try {
    const authed = await getAuthedUser(event, context);
    if (!authed) {
      return unauthorized();
    }

    if (event.httpMethod === 'GET') {
      const transactions = await listTransactionsByUser(authed.userId);
      return {
        statusCode: 200,
        body: JSON.stringify({ transactions }),
      };
    }

    if (event.httpMethod === 'POST') {
      const payload = parseBody(event.body);
      if (!payload) {
        return badRequest('Invalid JSON payload');
      }

      const validationError = validatePayload(payload);
      if (validationError) {
        return badRequest(validationError);
      }

      const transaction = {
        id: crypto.randomUUID(),
        type: payload.type,
        amount: payload.amount,
        category: payload.category,
        date: payload.date,
        note: payload.note || '',
      };

      await createTransactionForUser(authed.userId, transaction);

      return {
        statusCode: 200,
        body: JSON.stringify({ transaction }),
      };
    }

    return methodNotAllowed();
  } catch (error) {
    console.error('[transactions] handler failed', error);

    if (error && error.code === 'TX_STORE_UNAVAILABLE') {
      return {
        statusCode: 503,
        body: JSON.stringify({
          error: 'Transactions temporarily unavailable',
          code: 'TX_STORE_UNAVAILABLE',
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Transactions request failed',
        code: 'TX_UNKNOWN_ERROR',
      }),
    };
  }
};
