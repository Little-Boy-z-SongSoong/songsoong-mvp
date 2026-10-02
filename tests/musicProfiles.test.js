import test from 'node:test';
import assert from 'node:assert/strict';
import { MUSIC_PROFILES, chordFor, melodyNote, musicCondition } from '../src/audio/musicProfiles.js';

function phrase(city, stress) {
  const profile = MUSIC_PROFILES[city];
  return Array.from({ length: 4 }, (_, bar) => ({
    harmony: chordFor(city, stress, bar).pad.join('-'),
    bass: chordFor(city, stress, bar).bass,
    rhythm: profile.leadSteps.join(','),
    melody: profile.leadSteps.map((_, index) => melodyNote(city, stress, bar, index)).join('-'),
  }));
}

test('all five cities have different four-bar scores', () => {
  const cities = Object.keys(MUSIC_PROFILES);
  for (const stress of [0.2, 0.8]) {
    const signatures = cities.map((city) => JSON.stringify(phrase(city, stress)));
    assert.equal(new Set(signatures).size, cities.length);
  }
});

test('ecological condition changes harmony and melody in every city', () => {
  for (const city of Object.keys(MUSIC_PROFILES)) {
    assert.notDeepEqual(phrase(city, 0.2), phrase(city, 0.8), city);
  }
  assert.equal(musicCondition(0.2), 'clear');
  assert.equal(musicCondition(0.8), 'strained');
  assert.equal(musicCondition(0.5, 0), 'clear');
  assert.equal(musicCondition(0.5, 2), 'strained');
});
