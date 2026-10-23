/** Client-side RFC 6238 TOTP (HMAC-SHA1, 6 digits, 30 s) using WebCrypto only. */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Accepts a raw base32 secret (spaces/case tolerated) or an otpauth:// URI. */
export function extractSecret(input = '') {
  const s = String(input).trim();
  if (s.toLowerCase().startsWith('otpauth://')) {
    try {
      return new URL(s).searchParams.get('secret') || '';
    } catch {
      return '';
    }
  }
  return s;
}

export function base32Decode(input) {
  const clean = extractSecret(input).toUpperCase().replace(/[\s=-]/g, '');
  if (!clean || /[^A-Z2-7]/.test(clean)) return null;
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export const isValidTotpSecret = (s) => {
  const b = base32Decode(s);
  return !!b && b.length >= 10;
};

export async function generateTotp(secret, now = Date.now(), period = 30, digits = 6) {
  const keyBytes = base32Decode(secret);
  if (!keyBytes || !keyBytes.length) return null;
  const counter = Math.floor(now / 1000 / period);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
  const off = h[h.length - 1] & 0x0f;
  const bin =
    ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

export const secondsRemaining = (now = Date.now(), period = 30) =>
  period - (Math.floor(now / 1000) % period);
