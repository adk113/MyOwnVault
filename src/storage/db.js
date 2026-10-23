/** Tiny IndexedDB key/value wrapper. Only ciphertext + non-secret KDF metadata is ever stored. */
const DB_NAME = 'myownvault';
const STORE = 'kv';

let dbPromise;
const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const db = () => (dbPromise ??= open());

const run = async (mode, fn) => {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

export const dbGet = (k) => run('readonly', (s) => s.get(k));
export const dbSet = (k, v) => run('readwrite', (s) => s.put(v, k));
export const dbDel = (k) => run('readwrite', (s) => s.delete(k));
export const dbClear = () => run('readwrite', (s) => s.clear());
