/**
 * Biometric fast-unlock adapter.
 *
 * Web build: WebAuthn platform authenticator (Touch ID / Face ID / Windows Hello)
 * with userVerification=required gates release of the DEK, which is stored
 * encrypted under a non-extractable per-device key.
 *
 * Native build (Expo): replace this module with an implementation backed by
 * `expo-local-authentication` + `expo-secure-store` exposing the same four
 * functions; nothing else in the app needs to change.
 */
import { aesDecrypt, aesEncrypt, fromB64, randomBytes, toB64 } from './vaultCrypto.js';

export async function biometricAvailable() {
  try {
    return (
      !!window.PublicKeyCredential &&
      !!navigator.credentials &&
      (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

/** Enrol: prompts the OS biometric sheet, returns a record to persist. */
export async function registerBiometric(rawDek) {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: 'MyOwnVault' },
      user: { id: randomBytes(16), name: 'vault-owner', displayName: 'Vault Owner' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged',
      },
      timeout: 60_000,
    },
  });
  if (!cred) throw new Error('Biometric enrolment cancelled');
  const deviceKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
  const blob = await aesEncrypt(deviceKey, rawDek, 'bio-wrap');
  return { credId: toB64(cred.rawId), deviceKey, ...blob, createdAt: Date.now() };
}

/** Prompts the OS biometric sheet; resolves with raw DEK bytes on success. */
export async function unlockWithBiometric(record) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [{ type: 'public-key', id: fromB64(record.credId), transports: ['internal'] }],
      userVerification: 'required',
      timeout: 60_000,
    },
  });
  if (!assertion) throw new Error('Biometric check cancelled');
  return aesDecrypt(record.deviceKey, record, 'bio-wrap');
}
