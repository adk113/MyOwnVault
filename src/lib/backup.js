import { MODULES } from '../data/schema.js';
import { passphraseDecrypt, passphraseEncrypt } from '../crypto/vaultCrypto.js';

const FORMAT = 'myownvault-backup';

export async function buildBackupFile(vault, passphrase) {
  const enc = await passphraseEncrypt({ ...vault, exportedAt: Date.now() }, passphrase);
  return JSON.stringify({ app: 'MyOwnVault', format: FORMAT, version: 1, exportedAt: Date.now(), ...enc });
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readBackupFile(text, passphrase) {
  let file;
  try {
    file = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid MyOwnVault backup.');
  }
  if (file.format !== FORMAT || !file.kdf || !file.ct) throw new Error('Unrecognised backup format.');
  let data;
  try {
    data = await passphraseDecrypt(file, passphrase);
  } catch {
    throw new Error('Wrong passphrase, or the file was modified.');
  }
  if (!data?.items) throw new Error('Backup does not contain vault data.');
  return data;
}

const strip = (it) => {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = it;
  return JSON.stringify(rest, Object.keys(rest).sort());
};

/** Compare two field sets and return the labels of the fields that differ. */
function changedFields(moduleId, a, b) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const diffs = [];
  for (const f of mod.fields) {
    const va = a[f.key] ?? '';
    const vb = b[f.key] ?? '';
    if (JSON.stringify(va) !== JSON.stringify(vb)) diffs.push({ field: f, local: a[f.key], incoming: b[f.key] });
  }
  return diffs;
}

/**
 * Smart delta merge. Rows are matched by id; timestamps decide the suggested winner,
 * but every conflicting row is presented so the user picks per item.
 * status: 'new' (only in backup) | 'conflict' | 'same'
 */
export function diffVaults(local, incoming) {
  const rows = [];
  for (const m of MODULES) {
    const localMap = new Map((local.items[m.id] || []).map((it) => [it.id, it]));
    for (const inc of incoming.items?.[m.id] || []) {
      const loc = localMap.get(inc.id);
      if (!loc) {
        rows.push({ key: `${m.id}:${inc.id}`, moduleId: m.id, status: 'new', incoming: inc, choice: 'incoming' });
      } else if (strip(loc) !== strip(inc)) {
        const incNewer = (inc.updatedAt || 0) > (loc.updatedAt || 0);
        rows.push({
          key: `${m.id}:${inc.id}`,
          moduleId: m.id,
          status: 'conflict',
          local: loc,
          incoming: inc,
          incomingNewer: incNewer,
          diffs: changedFields(m.id, loc, inc),
          choice: incNewer ? 'incoming' : 'local',
        });
      } else {
        rows.push({ key: `${m.id}:${inc.id}`, moduleId: m.id, status: 'same', local: loc, incoming: inc, choice: 'local' });
      }
    }
  }
  return rows;
}

/** Apply user choices -> a new vault object. */
export function applyMerge(local, rows) {
  const items = Object.fromEntries(MODULES.map((m) => [m.id, [...(local.items[m.id] || [])]]));
  for (const r of rows) {
    if (r.status === 'same') continue;
    if (r.status === 'new' && r.choice === 'incoming') items[r.moduleId].push(r.incoming);
    if (r.status === 'conflict' && r.choice === 'incoming') {
      const i = items[r.moduleId].findIndex((it) => it.id === r.local.id);
      if (i >= 0) items[r.moduleId][i] = r.incoming;
    }
  }
  return { ...local, items, updatedAt: Date.now() };
}
