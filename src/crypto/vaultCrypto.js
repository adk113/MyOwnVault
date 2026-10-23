/**
 * MyOwnVault cryptographic core (100% WebCrypto, zero network).
 *
 * Key hierarchy
 *   master password ──PBKDF2-SHA256 (600,000 it., random 128-bit salt)──▶ AES-GCM-256 KEK
 *   recovery phrase ──PBKDF2-SHA256 (600,000 it., random 128-bit salt)──▶ AES-GCM-256 KEK
 *   KEK(s) each encrypt the same random 256-bit data key (DEK) -> "wrap slots".
 *   DEK (imported NON-extractable) encrypts the vault + rolling snapshots.
 *
 * Why wrap a DEK? It lets the recovery phrase, the duress profile and the
 * biometric slot all open the vault without ever storing the password, and
 * lets the password be changed without re-encrypting the data.
 */

export const KDF_ITERATIONS = 600_000;

const te = new TextEncoder();
const td = new TextDecoder();

export const toB64 = (buf) => {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) {
    s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  }
  return btoa(s);
};
export const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));

/** PBKDF2-SHA256 (600k iterations) -> non-extractable AES-GCM-256 key. */
export async function deriveKey(secret, salt) {
  const base = await crypto.subtle.importKey(
    'raw',
    te.encode(secret.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: KDF_ITERATIONS },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function aesEncrypt(key, bytes, aad) {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: te.encode(aad) },
    key,
    bytes,
  );
  return { iv: toB64(iv), ct: toB64(ct) };
}

export async function aesDecrypt(key, blob, aad) {
  const out = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(blob.iv), additionalData: te.encode(aad) },
    key,
    fromB64(blob.ct),
  );
  return new Uint8Array(out);
}

export const rawToKey = (raw) =>
  crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);

export const newDataKey = () => randomBytes(32);

/** Wrap raw DEK bytes under a secret (password / recovery phrase). */
export async function wrapRaw(raw, secret) {
  const salt = randomBytes(16);
  const kek = await deriveKey(secret, salt);
  return { salt: toB64(salt), ...(await aesEncrypt(kek, raw, 'dek-wrap')) };
}

/** Returns raw DEK bytes, or null when the secret is wrong (GCM tag fails). */
export async function unwrapRaw(slot, secret) {
  try {
    const kek = await deriveKey(secret, fromB64(slot.salt));
    return await aesDecrypt(kek, slot, 'dek-wrap');
  } catch {
    return null;
  }
}

/** Burn derived-key material from a typed array as soon as possible. */
export const wipe = (u8) => {
  if (u8 && u8.fill) u8.fill(0);
};

export const encryptJSON = (key, obj, aad) =>
  aesEncrypt(key, te.encode(JSON.stringify(obj)), aad);

export async function decryptJSON(key, blob, aad) {
  return JSON.parse(td.decode(await aesDecrypt(key, blob, aad)));
}

/** Passphrase-protected portable backup file (independent from vault keys). */
export async function passphraseEncrypt(obj, passphrase) {
  const salt = randomBytes(16);
  const key = await deriveKey(passphrase, salt);
  const blob = await encryptJSON(key, obj, 'myownvault-backup');
  return {
    kdf: { name: 'PBKDF2-SHA256', iterations: KDF_ITERATIONS, salt: toB64(salt) },
    ...blob,
  };
}

export async function passphraseDecrypt(file, passphrase) {
  const key = await deriveKey(passphrase, fromB64(file.kdf.salt));
  return decryptJSON(key, file, 'myownvault-backup');
}
