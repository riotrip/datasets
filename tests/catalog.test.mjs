import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRecords } from '../src/scripts/catalog.js';

const records = [
  { title: 'Sistem pakar', abstract: 'Analisis penyakit kulit', category: 'extracted', reviewStatus: 'approved' },
  { title: 'Aplikasi kampus', abstract: 'Manajemen kunjungan siswa', category: 'needs_review', reviewStatus: 'pending' },
  { title: 'Dashboard penerbangan', abstract: 'Data analytics bandara', category: 'unavailable', reviewStatus: 'approved' },
];

test('finds matches in full abstract text, case-insensitively', () => {
  assert.deepEqual(filterRecords(records, 'PENYAKIT KULIT'), [records[0]]);
});

test('searches record titles', () => {
  assert.deepEqual(filterRecords(records, 'DASHBOARD'), [records[2]]);
});

test('returns no matches for an absent search term', () => {
  assert.deepEqual(filterRecords(records, 'tidak ada'), []);
});
test('groups by review approval first, then extraction category', () => {
  const approved = { title: 'Disetujui', category: 'extracted', reviewStatus: 'approved', isActive: true };
  const reviewed = { title: 'Sudah diperiksa', category: 'needs_review', reviewStatus: 'approved', isActive: true };
  const approvedOverride = { title: 'Persetujuan utama', category: 'unavailable', reviewStatus: 'approved', isActive: false };
  const missing = { title: 'Belum ada', category: 'unavailable', reviewStatus: 'pending', isActive: true };
  const inactiveMissing = { title: 'Nonaktif belum ada', abstract: 'Teks tidak sesuai', category: 'unavailable', reviewStatus: 'pending', isActive: false };
  const excluded = { title: 'Nonaktif', abstract: 'Isi abstrak', category: 'extracted', reviewStatus: 'pending', isActive: false };
  const dataset = [approved, reviewed, approvedOverride, missing, inactiveMissing, excluded];
  assert.deepEqual(filterRecords(dataset, '', 'available'), [approved, reviewed, approvedOverride]);
  assert.deepEqual(filterRecords(dataset, '', 'unavailable'), [missing, inactiveMissing]);
  assert.deepEqual(filterRecords(dataset, '', 'excluded'), [excluded]);
  assert.deepEqual(filterRecords(dataset, 'tidak sesuai', 'unavailable'), [inactiveMissing]);
  assert.deepEqual(filterRecords(dataset), dataset);
});
