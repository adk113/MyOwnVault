import test from 'node:test';
import assert from 'node:assert/strict';
import { KDF_ITERATIONS, decryptJSON, encryptJSON, newDataKey, passphraseDecrypt, passphraseEncrypt, rawToKey, unwrapRaw, wrapRaw } from '../src/crypto/vaultCrypto.js';
import { generateTotp, isValidTotpSecret } from '../src/crypto/totp.js';
import { daysUntil, fromISO, parseDateInput } from '../src/lib/dates.js';
import { computeNetWorth, diversification, generateInsights } from '../src/lib/analytics.js';
import { applyMerge, diffVaults } from '../src/lib/backup.js';
import { emptyVault } from '../src/data/schema.js';
import { buildDecoyVault } from '../src/data/decoy.js';
import { matchInstitution, searchInstitutions } from '../src/data/institutions.js';
import { safeUrl } from '../src/lib/format.js';

test('KDF uses exactly 600,000 iterations', () => assert.equal(KDF_ITERATIONS, 600000));

test('password wrap/unwrap round-trip, wrong secret rejected, vault encrypt/decrypt', async () => {
  const raw = newDataKey();
  const slot = await wrapRaw(raw, 'correct horse battery staple');
  assert.deepEqual(await unwrapRaw(slot, 'correct horse battery staple'), raw);
  assert.equal(await unwrapRaw(slot, 'wrong'), null);
  const key = await rawToKey(raw);
  const blob = await encryptJSON(key, { hello: 'world' }, 'vault:main');
  assert.deepEqual(await decryptJSON(key, blob, 'vault:main'), { hello: 'world' });
  await assert.rejects(decryptJSON(key, blob, 'vault:decoy')); // AAD binds ciphertext to its profile
});

test('same DEK opens via password slot and recovery slot', async () => {
  const raw = newDataKey();
  const pw = await wrapRaw(raw, 'master-password');
  const rec = await wrapRaw(raw, 'legal winner thank year wave sausage worth useful legal winner thank yellow');
  assert.deepEqual(await unwrapRaw(rec, 'legal winner thank year wave sausage worth useful legal winner thank yellow'), await unwrapRaw(pw, 'master-password'));
});

test('encrypted backup file round-trip', async () => {
  const v = buildDecoyVault();
  const file = await passphraseEncrypt(v, 'backup-pass');
  assert.equal(file.kdf.iterations, 600000);
  assert.deepEqual((await passphraseDecrypt(file, 'backup-pass')).items.banking.length, v.items.banking.length);
  await assert.rejects(passphraseDecrypt(file, 'nope'));
});

test('TOTP matches RFC 6238 vector', async () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.ok(isValidTotpSecret(secret));
  assert.equal(await generateTotp(secret, 59_000), '287082');
  assert.equal(await generateTotp(`otpauth://totp/x?secret=${secret}`, 1111111109_000), '081804');
});

test('date parsing: manual overrides', () => {
  assert.equal(parseDateInput('05/12/2027'), '2027-12-05');
  assert.equal(parseDateInput('2027-12-05'), '2027-12-05');
  assert.equal(parseDateInput('5 Dec 2027'), '2027-12-05');
  assert.equal(parseDateInput('31/02/2027'), null);
  assert.equal(parseDateInput('08/28', { monthOnly: true }), '2028-08-31');
  assert.equal(parseDateInput('08/28'), null);
});

test('recurring due dates roll forward monthly', () => {
  const now = new Date(2026, 9, 23); // 23 Oct 2026
  assert.equal(daysUntil('2025-01-25', now, true), 2);
  assert.equal(daysUntil('2025-01-05', now, true), 13); // → 5 Nov
  assert.equal(daysUntil('2026-10-20', now, false), -3);
  assert.ok(fromISO('2026-10-23'));
});

test('net worth, diversification and insights', () => {
  const v = emptyVault();
  v.items.banking = [{ id: 'a', balance: 1000 }];
  v.items.equities = [{ id: 'b', valuation: 3000 }];
  v.items.retirement = [{ id: 'c', balance: 6000 }];
  v.items.credit = [{ id: 'd', nickname: 'Card', outstanding: 500, dueDate: '2026-10-25' }];
  v.items.liabilities = [{ id: 'e', title: 'Loan', balance: 2500, apr: 18, emi: 100, paymentDeadline: '2026-01-01' }];
  const nw = computeNetWorth(v);
  assert.equal(nw.assets, 10000);
  assert.equal(nw.debt, 3000);
  assert.equal(nw.net, 7000);
  assert.equal(Math.round(diversification(v).find((d) => d.name === 'Retirement').pct), 60);
  const ins = generateInsights(v, new Date(2026, 9, 23));
  assert.ok(ins.some((i) => i.kind === 'due' && i.id === 'd' && i.days === 2));
  assert.ok(ins.some((i) => i.kind === 'apr' && i.id === 'e'));
});

test('smart delta merge highlights conflicts and respects choices', () => {
  const local = emptyVault();
  local.items.banking = [{ id: '1', nickname: 'Mine', balance: 1, updatedAt: 100 }, { id: '3', nickname: 'Same', updatedAt: 1 }];
  const incoming = emptyVault();
  incoming.items.banking = [{ id: '1', nickname: 'Theirs', balance: 2, updatedAt: 200 }, { id: '2', nickname: 'New', updatedAt: 5 }, { id: '3', nickname: 'Same', updatedAt: 9 }];
  const rows = diffVaults(local, incoming);
  const conflict = rows.find((r) => r.status === 'conflict');
  assert.equal(conflict.incomingNewer, true);
  assert.ok(conflict.diffs.some((d) => d.field.key === 'nickname'));
  assert.equal(rows.find((r) => r.key === 'banking:3').status, 'same');
  const merged = applyMerge(local, rows);
  assert.equal(merged.items.banking.find((x) => x.id === '1').nickname, 'Theirs');
  assert.ok(merged.items.banking.some((x) => x.id === '2'));
  conflict.choice = 'local';
  assert.equal(applyMerge(local, rows).items.banking.find((x) => x.id === '1').nickname, 'Mine');
});

test('institution dictionary auto-fills official portals', () => {
  assert.equal(matchInstitution('hdfc bank').url, 'https://www.hdfcbank.com/');
  assert.equal(matchInstitution('SBI').name, 'State Bank of India');
  assert.equal(matchInstitution('EPF').url.includes('epfindia.gov.in'), true);
  assert.ok(searchInstitutions('zer', 'k').some((i) => i.name === 'Zerodha'));
  assert.equal(matchInstitution('unknown bank xyz'), null);
});

test('safeUrl blocks non-http schemes', () => {
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('hdfcbank.com'), 'https://hdfcbank.com/');
});
