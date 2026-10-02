import test from 'node:test';
import assert from 'node:assert/strict';
import { compositionForSite } from '../src/data/composition.js';

test('relative nitrate cannot make poor ecological ratings sound clear', () => {
  const portrait = compositionForSite([
    { kind: 'macro', quality: 'Bad', stress: 0.92, richness: 5, layerDensity: 0.2, date: '2023-05-01' },
    { kind: 'diatoms', quality: 'Poor', stress: 0.73, richness: null, layerDensity: 0.35, date: '2023-07-28' },
    { kind: 'nitrate', stress: 0.1, percentile: 0.02, richness: null, date: '2023-07-28' },
  ]);

  assert.equal(portrait.basis, 'ecological');
  assert.equal(portrait.stress, (0.92 + 0.73) / 2);
  assert.equal(portrait.percentile, 0.02);
  assert.equal(portrait.signalCount, 3);
});

test('a nitrate-only portrait stays explicitly relative', () => {
  const portrait = compositionForSite([
    { kind: 'nitrate', stress: 0.8, percentile: 0.875, richness: null, date: '2024-01-01' },
  ]);
  assert.equal(portrait.basis, 'nitrate');
  assert.equal(portrait.stress, 0.8);
  assert.equal(portrait.percentile, 0.875);
  assert.equal(portrait.ecologicalCount, 0);
});
