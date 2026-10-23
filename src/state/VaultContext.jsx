import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  KDF_ITERATIONS,
  decryptJSON,
  deriveKey,
  encryptJSON,
  newDataKey,
  rawToKey,
  unwrapRaw,
  wipe,
  wrapRaw,
} from '../crypto/vaultCrypto.js';
import { biometricAvailable, registerBiometric, unlockWithBiometric } from '../crypto/biometric.js';
import { dbClear, dbDel, dbGet, dbSet } from '../storage/db.js';
import { MODULES, emptyVault, newId } from '../data/schema.js';
import { buildDecoyVault } from '../data/decoy.js';
import { applyMerge, buildBackupFile, diffVaults, readBackupFile } from '../lib/backup.js';

const VaultCtx = createContext(null);
export const useVault = () => useContext(VaultCtx);

const MAX_SNAPSHOTS = 3;
const SNAPSHOT_MIN_GAP_MS = 30_000; // bursts of edits share one pre-change snapshot
const aadFor = (profile) => `vault:${profile}`;
export const normalizeMnemonic = (m) => m.trim().toLowerCase().split(/\s+/).join(' ');

/** Encrypts and stores the vault; rolls the previous ciphertext into ≤3 snapshots. */
async function persistVault(profile, key, data, forceSnapshot = false) {
  const blob = { ...(await encryptJSON(key, data, aadFor(profile))), updatedAt: Date.now() };
  if (profile === 'main') {
    const prev = await dbGet('vault:main');
    if (prev) {
      const snaps = (await dbGet('snapshots:main')) || [];
      const latest = snaps[0];
      if (forceSnapshot || !latest || Date.now() - latest.takenAt > SNAPSHOT_MIN_GAP_MS) {
        snaps.unshift({ ts: prev.updatedAt || Date.now(), takenAt: Date.now(), iv: prev.iv, ct: prev.ct });
        await dbSet('snapshots:main', snaps.slice(0, MAX_SNAPSHOTS));
      }
    }
  }
  await dbSet(`vault:${profile}`, blob);
}

const hydrate = (v) => {
  const base = emptyVault();
  return {
    ...base,
    ...v,
    items: Object.fromEntries(MODULES.map((m) => [m.id, v.items?.[m.id] || []])),
    settings: { ...base.settings, ...(v.settings || {}) },
  };
};

export function VaultProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | uninitialized | locked | unlocked
  const [profile, setProfile] = useState('main'); // 'decoy' when the duress password was used
  const [vault, setVault] = useState(null);
  const [flags, setFlags] = useState({ hasDuress: false, hasBio: false, bioSupported: false });

  const keyRef = useRef(null); // non-extractable CryptoKey – dropped on lock
  const vaultRef = useRef(null);
  const profileRef = useRef('main');
  const queue = useRef(Promise.resolve());

  const refreshFlags = useCallback(async () => {
    const [meta, bio, supported] = await Promise.all([dbGet('meta'), dbGet('bio'), biometricAvailable()]);
    setFlags({ hasDuress: !!meta?.duress, hasBio: !!bio, bioSupported: supported });
    return meta;
  }, []);

  useEffect(() => {
    (async () => {
      const meta = await refreshFlags();
      setStatus(meta ? 'locked' : 'uninitialized');
    })();
  }, [refreshFlags]);

  const open = useCallback(async (prof, raw) => {
    const key = await rawToKey(raw);
    wipe(raw);
    const blob = await dbGet(aadFor(prof));
    if (!blob) throw new Error('Vault data missing');
    const data = hydrate(await decryptJSON(key, blob, aadFor(prof)));
    keyRef.current = key;
    vaultRef.current = data;
    profileRef.current = prof;
    setVault(data);
    setProfile(prof);
    setStatus('unlocked');
  }, []);

  /** Flush key + decrypted state from memory and return to the login screen. */
  const lock = useCallback(() => {
    keyRef.current = null;
    vaultRef.current = null;
    profileRef.current = 'main';
    setVault(null);
    setProfile('main');
    setStatus('locked');
  }, []);

  const commit = useCallback((next, opts = {}) => {
    next.updatedAt = Date.now();
    vaultRef.current = next;
    setVault(next);
    const key = keyRef.current;
    const prof = profileRef.current;
    queue.current = queue.current
      .then(() => persistVault(prof, key, next, opts.forceSnapshot))
      .catch((e) => console.error('persist failed', e));
  }, []);

  const mutate = useCallback((fn, opts) => commit(fn(vaultRef.current), opts), [commit]);

  // ── lifecycle ────────────────────────────────────────────────
  const setup = useCallback(
    async (password, mnemonic) => {
      const raw = newDataKey();
      const pw = await wrapRaw(raw, password);
      const rec = await wrapRaw(raw, normalizeMnemonic(mnemonic));
      const key = await rawToKey(raw);
      wipe(raw);
      const data = emptyVault();
      await persistVault('main', key, data);
      await dbSet('meta', {
        v: 1,
        kdf: { name: 'PBKDF2-SHA256', iterations: KDF_ITERATIONS },
        main: { pw, rec },
        createdAt: Date.now(),
      });
      keyRef.current = key;
      vaultRef.current = data;
      profileRef.current = 'main';
      setVault(data);
      setProfile('main');
      await refreshFlags();
      setStatus('unlocked');
    },
    [refreshFlags],
  );

  const unlock = useCallback(
    async (password) => {
      const meta = await dbGet('meta');
      // Always perform two derivations so timing doesn't reveal whether a duress profile exists.
      const rawMain = await unwrapRaw(meta.main.pw, password);
      let rawDuress = null;
      if (meta.duress) rawDuress = await unwrapRaw(meta.duress.pw, password);
      else await deriveKey(password, new Uint8Array(16));
      if (rawMain) {
        wipe(rawDuress);
        await open('main', rawMain);
        return { ok: true };
      }
      if (rawDuress) {
        await open('decoy', rawDuress);
        return { ok: true };
      }
      return { ok: false, error: 'Incorrect master password.' };
    },
    [open],
  );

  const unlockBiometric = useCallback(async () => {
    try {
      const rec = await dbGet('bio');
      if (!rec) return { ok: false, error: 'Biometric unlock is not enabled.' };
      const raw = await unlockWithBiometric(rec);
      await open('main', raw);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.name === 'NotAllowedError' ? 'Biometric check was cancelled.' : 'Biometric unlock failed.' };
    }
  }, [open]);

  const recover = useCallback(
    async (mnemonic, newPassword) => {
      const meta = await dbGet('meta');
      const raw = await unwrapRaw(meta.main.rec, normalizeMnemonic(mnemonic));
      if (!raw) return { ok: false, error: 'Those words do not match this vault.' };
      meta.main.pw = await wrapRaw(raw, newPassword);
      await dbSet('meta', meta);
      await open('main', raw);
      return { ok: true };
    },
    [open],
  );

  const eraseAll = useCallback(async () => {
    await dbClear();
    lock();
    await refreshFlags();
    setStatus('uninitialized');
  }, [lock, refreshFlags]);

  // ── data ─────────────────────────────────────────────────────
  const upsertItem = useCallback(
    (moduleId, item) =>
      mutate((v) => {
        const now = Date.now();
        const list = v.items[moduleId];
        const idx = list.findIndex((x) => x.id === item.id);
        const saved = idx >= 0 ? { ...item, updatedAt: now } : { ...item, id: item.id || newId(), createdAt: now, updatedAt: now };
        const nextList = idx >= 0 ? list.map((x, i) => (i === idx ? saved : x)) : [saved, ...list];
        return { ...v, items: { ...v.items, [moduleId]: nextList } };
      }),
    [mutate],
  );

  const deleteItem = useCallback(
    (moduleId, id) =>
      mutate((v) => ({ ...v, items: { ...v.items, [moduleId]: v.items[moduleId].filter((x) => x.id !== id) } })),
    [mutate],
  );

  const updateSettings = useCallback(
    (patch) => mutate((v) => ({ ...v, settings: { ...v.settings, ...patch } })),
    [mutate],
  );

  // ── security settings ────────────────────────────────────────
  const changePassword = useCallback(async (current, next) => {
    const meta = await dbGet('meta');
    const raw = await unwrapRaw(meta.main.pw, current);
    if (!raw) return { ok: false, error: 'Current password is incorrect.' };
    meta.main.pw = await wrapRaw(raw, next);
    wipe(raw);
    await dbSet('meta', meta);
    return { ok: true };
  }, []);

  const setDuress = useCallback(
    async (masterPassword, duressPassword) => {
      const meta = await dbGet('meta');
      const rawMain = await unwrapRaw(meta.main.pw, masterPassword);
      if (!rawMain) return { ok: false, error: 'Master password is incorrect.' };
      wipe(rawMain);
      if (duressPassword.normalize('NFKC') === masterPassword.normalize('NFKC'))
        return { ok: false, error: 'Duress password must differ from your master password.' };
      const raw = newDataKey();
      const slot = await wrapRaw(raw, duressPassword);
      const key = await rawToKey(raw);
      wipe(raw);
      await persistVault('decoy', key, buildDecoyVault());
      meta.duress = { pw: slot };
      await dbSet('meta', meta);
      await refreshFlags();
      return { ok: true };
    },
    [refreshFlags],
  );

  const removeDuress = useCallback(async () => {
    const meta = await dbGet('meta');
    delete meta.duress;
    await dbSet('meta', meta);
    await dbDel('vault:decoy');
    await refreshFlags();
  }, [refreshFlags]);

  const enableBiometric = useCallback(
    async (password) => {
      try {
        const meta = await dbGet('meta');
        const raw = await unwrapRaw(meta.main.pw, password);
        if (!raw) return { ok: false, error: 'Master password is incorrect.' };
        const rec = await registerBiometric(raw);
        wipe(raw);
        await dbSet('bio', rec);
        await refreshFlags();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.name === 'NotAllowedError' ? 'Enrolment was cancelled.' : 'Biometric enrolment failed on this device.' };
      }
    },
    [refreshFlags],
  );

  const disableBiometric = useCallback(async () => {
    await dbDel('bio');
    await refreshFlags();
  }, [refreshFlags]);

  // ── snapshots & backups ──────────────────────────────────────
  const listSnapshots = useCallback(async () => {
    const snaps = (await dbGet('snapshots:main')) || [];
    const out = [];
    for (let i = 0; i < snaps.length; i++) {
      try {
        const data = await decryptJSON(keyRef.current, snaps[i], aadFor('main'));
        out.push({ index: i, ts: snaps[i].ts, count: Object.values(data.items || {}).reduce((a, l) => a + l.length, 0) });
      } catch {
        out.push({ index: i, ts: snaps[i].ts, count: null });
      }
    }
    return out;
  }, []);

  const restoreSnapshot = useCallback(
    async (index) => {
      const snaps = (await dbGet('snapshots:main')) || [];
      const data = hydrate(await decryptJSON(keyRef.current, snaps[index], aadFor('main')));
      commit({ ...data }, { forceSnapshot: true });
    },
    [commit],
  );

  const exportBackup = useCallback((passphrase) => buildBackupFile(vaultRef.current, passphrase), []);

  const previewImport = useCallback(async (text, passphrase) => {
    const incoming = await readBackupFile(text, passphrase);
    return { rows: diffVaults(vaultRef.current, hydrate(incoming)), exportedAt: incoming.exportedAt };
  }, []);

  const applyImport = useCallback((rows) => commit(applyMerge(vaultRef.current, rows), { forceSnapshot: true }), [commit]);

  const value = useMemo(
    () => ({
      status,
      profile,
      isDecoy: profile === 'decoy',
      vault,
      flags,
      setup,
      unlock,
      unlockBiometric,
      recover,
      lock,
      eraseAll,
      upsertItem,
      deleteItem,
      updateSettings,
      changePassword,
      setDuress,
      removeDuress,
      enableBiometric,
      disableBiometric,
      listSnapshots,
      restoreSnapshot,
      exportBackup,
      previewImport,
      applyImport,
    }),
    [
      status, profile, vault, flags, setup, unlock, unlockBiometric, recover, lock, eraseAll, upsertItem, deleteItem,
      updateSettings, changePassword, setDuress, removeDuress, enableBiometric, disableBiometric, listSnapshots,
      restoreSnapshot, exportBackup, previewImport, applyImport,
    ],
  );
  return <VaultCtx.Provider value={value}>{children}</VaultCtx.Provider>;
}
