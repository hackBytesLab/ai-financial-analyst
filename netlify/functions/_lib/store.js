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
  const updated = [transaction, ...current].sort((a, b) => {
    if (a.date === b.date) {
      return 0;
    }
    return a.date > b.date ? -1 : 1;
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
