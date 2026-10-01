// Curated, consonant progressions. The environmental data selects their mood,
// pace and ornament density; it never maps a measurement directly to pitch.
const chords = {
  Dmaj7: { pad: ['D4', 'F#4', 'A4', 'C#5'], bass: 'D2' },
  Aadd9: { pad: ['A3', 'C#4', 'E4', 'B4'], bass: 'A2' },
  Bm7: { pad: ['B3', 'D4', 'F#4', 'A4'], bass: 'B2' },
  Gmaj7: { pad: ['G3', 'B3', 'D4', 'F#4'], bass: 'G2' },
  Cmaj7: { pad: ['C4', 'E4', 'G4', 'B4'], bass: 'C3' },
  G6: { pad: ['G3', 'B3', 'D4', 'E4'], bass: 'G2' },
  Am7: { pad: ['A3', 'C4', 'E4', 'G4'], bass: 'A2' },
  Fmaj7: { pad: ['F3', 'A3', 'C4', 'E4'], bass: 'F2' },
  Em7: { pad: ['E3', 'G3', 'B3', 'D4'], bass: 'E2' },
  Dadd9: { pad: ['D4', 'F#4', 'A4', 'E5'], bass: 'D2' },
  Dm7: { pad: ['D4', 'F4', 'A4', 'C5'], bass: 'D2' },
  Bbmaj7: { pad: ['Bb3', 'D4', 'F4', 'A4'], bass: 'Bb2' },
};

export const MUSIC_PROFILES = {
  oslo: {
    bright: ['Dmaj7', 'Aadd9', 'Bm7', 'Gmaj7'],
    reflective: ['Bm7', 'Gmaj7', 'Dmaj7', 'Aadd9'],
    motif: [0, 2, 1, 2],
  },
  benevento: {
    bright: ['Cmaj7', 'G6', 'Am7', 'Fmaj7'],
    reflective: ['Am7', 'Fmaj7', 'Cmaj7', 'G6'],
    motif: [1, 0, 2, 1],
  },
  ghent: {
    bright: ['Gmaj7', 'Dadd9', 'Em7', 'Cmaj7'],
    reflective: ['Em7', 'Cmaj7', 'Gmaj7', 'Dadd9'],
    motif: [2, 1, 0, 1],
  },
  toulouse: {
    bright: ['Cmaj7', 'Am7', 'Fmaj7', 'G6'],
    reflective: ['Am7', 'Fmaj7', 'Cmaj7', 'G6'],
    motif: [0, 1, 2, 0],
  },
  coimbra: {
    bright: ['Fmaj7', 'Cmaj7', 'Dm7', 'Bbmaj7'],
    reflective: ['Dm7', 'Bbmaj7', 'Fmaj7', 'Cmaj7'],
    motif: [1, 2, 0, 1],
  },
};

export function chordFor(cityId, stress, bar, siteSeed = 0) {
  const profile = MUSIC_PROFILES[cityId] || MUSIC_PROFILES.ghent;
  const reflective = stress >= 0.65 || (stress >= 0.32 && Math.floor(bar / 4) % 2 === 1);
  const progression = reflective ? profile.reflective : profile.bright;
  return chords[progression[(bar + siteSeed % 4) % progression.length]];
}

export function melodyNote(chord, cityId, bar, phraseStep, siteSeed = 0) {
  const profile = MUSIC_PROFILES[cityId] || MUSIC_PROFILES.ghent;
  const position = (phraseStep + siteSeed % 3) % profile.motif.length;
  const chordTone = chord.pad[(profile.motif[position] + bar % 2) % chord.pad.length];
  return chordTone.replace(/\d+$/, '5');
}

export function siteSeedFromCode(code = '') {
  return Array.from(code).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
}
