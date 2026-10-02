import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { listeningChallengePair } from './listeningChallenge.js';

const snapshot = JSON.parse(readFileSync(new URL('./enoraSnapshot.json', import.meta.url), 'utf8'));

test('listening comparison uses real same-day Coimbra invertebrate records with contrasting ratings', () => {
  const pair = listeningChallengePair(snapshot, snapshot);
  assert.equal(pair?.length, 2);
  assert.deepEqual(pair.map((item) => item.row.date), ['2023-06-06T00:00:00Z', '2023-06-06T00:00:00Z']);
  assert.deepEqual(pair.map((item) => item.signal.quality), ['Good', 'Poor']);
  assert.ok(pair[0].signal.stress < pair[1].signal.stress);
  assert.ok(pair[0].signal.richness > pair[1].signal.richness);
});
