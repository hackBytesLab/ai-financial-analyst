import { getStore } from '@netlify/blobs';

function keyForUser(userId) {
  return `transactions:${userId}`;
}

function getTransactionsStore() {
  try {
    return getStore({ name: 'transactions' });
  } catch (error) {
    const wrapped = new Error('Transactions store is unavailable');
    wrapped.code = 'TX_STORE_UNAVAILABLE';
    wrapped.cause = error;
    throw wrapped;
  }
}

export async function listTransactionsByUser(userId) {
  const key = keyForUser(userId);
  const store = getTransactionsStore();
  try {
    const value = await store.get(key, { type: 'json' });
    if (!Array.isArray(value)) {
      return [];
    }
    return value;
  } catch (error) {
    const wrapped = new Error('Failed to read transactions store');
    wrapped.code = 'TX_STORE_UNAVAILABLE';
    wrapped.cause = error;
    throw wrapped;
  }
}

export async function createTransactionForUser(userId, transaction) {
  const current = await listTransactionsByUser(userId);
  const raw = [transaction, ...current];
  const indexById = new Map(raw.map((item, index) => [item.id, index]));
  const parseDate = (value) => {
    const t = Date.parse(`${value}T00:00:00Z`);
    return Number.isNaN(t) ? null : t;
  };

  const updated = raw.sort((a, b) => {
    const aTime = parseDate(a.date);
    const bTime = parseDate(b.date);

    if (aTime != null && bTime != null) {
      return bTime - aTime;
    }
    if (aTime != null) return -1;
    if (bTime != null) return 1;

    const aIdx = indexById.get(a.id) ?? 0;
    const bIdx = indexById.get(b.id) ?? 0;
    return aIdx - bIdx;
  });

  try {
    const store = getTransactionsStore();
    await store.setJSON(keyForUser(userId), updated);
  } catch (error) {
    const wrapped = new Error('Failed to write transactions store');
    wrapped.code = 'TX_STORE_UNAVAILABLE';
    wrapped.cause = error;
    throw wrapped;
  }
  return transaction;
}
