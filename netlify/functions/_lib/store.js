import { getStore } from '@netlify/blobs';

function legacyKeyForUser(userId) {
  return `transactions:${userId}`;
}

function txPrefixForUser(userId) {
  return `transactions:${userId}:`;
}

function txKeyForUser(userId, txId) {
  return `${txPrefixForUser(userId)}${txId}`;
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

function parseDateForSort(value) {
  const t = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

function parseTimestamp(value) {
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

function normalizeTxShape(raw, fallbackCreatedAt = null) {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw;
  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) return null;
  if (candidate.type !== 'income' && candidate.type !== 'expense' && candidate.type !== 'invest') return null;
  if (typeof candidate.amount !== 'number' || !Number.isFinite(candidate.amount) || candidate.amount <= 0) return null;
  if (typeof candidate.category !== 'string' || candidate.category.trim().length === 0) return null;
  if (typeof candidate.date !== 'string' || candidate.date.trim().length === 0) return null;
  const note = typeof candidate.note === 'string' ? candidate.note : '';
  const createdAt = typeof candidate.createdAt === 'string' && candidate.createdAt.trim().length > 0
    ? candidate.createdAt
    : fallbackCreatedAt || new Date().toISOString();

  return {
    id: candidate.id,
    type: candidate.type,
    amount: candidate.amount,
    category: candidate.category,
    date: candidate.date,
    note,
    createdAt,
  };
}

function sortTransactions(items) {
  return items.sort((a, b) => {
    const aDate = parseDateForSort(a.date);
    const bDate = parseDateForSort(b.date);

    if (aDate != null && bDate != null && aDate !== bDate) {
      return bDate - aDate;
    }
    if (aDate != null && bDate == null) return -1;
    if (aDate == null && bDate != null) return 1;

    const aCreatedAt = parseTimestamp(a.createdAt);
    const bCreatedAt = parseTimestamp(b.createdAt);
    if (aCreatedAt != null && bCreatedAt != null && aCreatedAt !== bCreatedAt) {
      return bCreatedAt - aCreatedAt;
    }
    if (aCreatedAt != null && bCreatedAt == null) return -1;
    if (aCreatedAt == null && bCreatedAt != null) return 1;

    return String(b.id).localeCompare(String(a.id));
  });
}

export async function listTransactionsByUser(userId) {
  const store = getTransactionsStore();
  try {
    const txById = new Map();

    const keyPrefix = txPrefixForUser(userId);
    for await (const page of store.list({ prefix: keyPrefix, paginate: true })) {
      if (!Array.isArray(page?.blobs) || page.blobs.length === 0) continue;
      const entries = await Promise.all(
        page.blobs.map(async (blob) => {
          const value = await store.get(blob.key, { type: 'json' });
          return normalizeTxShape(value);
        }),
      );
      entries.filter(Boolean).forEach((entry) => {
        txById.set(entry.id, entry);
      });
    }

    const legacyValue = await store.get(legacyKeyForUser(userId), { type: 'json' });
    if (Array.isArray(legacyValue) && legacyValue.length > 0) {
      const legacyEntries = legacyValue
        .map((entry) => normalizeTxShape(entry))
        .filter(Boolean);

      await Promise.all(
        legacyEntries.map((entry) =>
          store.setJSON(txKeyForUser(userId, entry.id), entry, { onlyIfNew: true }),
        ),
      );

      legacyEntries.forEach((entry) => {
        if (!txById.has(entry.id)) {
          txById.set(entry.id, entry);
        }
      });
    }

    const normalized = sortTransactions(Array.from(txById.values()));
    return normalized.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      date: entry.date,
      note: entry.note,
    }));
  } catch (error) {
    const wrapped = new Error('Failed to read transactions store');
    wrapped.code = 'TX_STORE_UNAVAILABLE';
    wrapped.cause = error;
    throw wrapped;
  }
}

export async function createTransactionForUser(userId, transaction) {
  try {
    const store = getTransactionsStore();
    const payload = {
      ...transaction,
      createdAt: new Date().toISOString(),
    };
    await store.setJSON(txKeyForUser(userId, transaction.id), payload, { onlyIfNew: true });
  } catch (error) {
    const wrapped = new Error('Failed to write transactions store');
    wrapped.code = 'TX_STORE_UNAVAILABLE';
    wrapped.cause = error;
    throw wrapped;
  }
  return transaction;
}
