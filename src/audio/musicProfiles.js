// Published observations select a musical condition. These are composed city
// themes, not pitches calculated from measurements or safety thresholds.
const chord = (pad, bass) => ({ pad, bass });

export const MUSIC_PROFILES = {
  oslo: {
    instrument: 'glass', leadSteps: [0, 4], accentSteps: [3, 7], bassSteps: [0],
    motif: [0, 3, 4, 2, 1, 3], noteLength: '4n',
    clearScale: ['D5', 'E5', 'F#5', 'A5', 'B5', 'C#6'],
    strainedScale: ['B4', 'C#5', 'D5', 'F#5', 'A5', 'B5'],
    clear: [
      chord(['D4', 'F#4', 'A4', 'E5'], 'D2'),
      chord(['E4', 'G#4', 'B4', 'F#5'], 'E2'),
      chord(['B3', 'D4', 'F#4', 'C#5'], 'B2'),
      chord(['G3', 'B3', 'D4', 'A4'], 'G2'),
    ],
    strained: [
      chord(['B3', 'D4', 'F#4', 'C#5'], 'B1'),
      chord(['G3', 'B3', 'D4', 'F#4'], 'G2'),
      chord(['E3', 'G3', 'B3', 'D4'], 'E2'),
      chord(['A3', 'D4', 'E4', 'G4'], 'A2'),
    ],
  },
  benevento: {
    instrument: 'pluck', leadSteps: [0, 2, 3, 5, 6], accentSteps: [2, 5], bassSteps: [0, 3, 6],
    motif: [0, 2, 4, 3, 1, 2, 0, 4], noteLength: '16n',
    clearScale: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'],
    strainedScale: ['A4', 'B4', 'C5', 'D5', 'E5', 'G5'],
    clear: [
      chord(['C4', 'E4', 'G4', 'A4'], 'C2'),
      chord(['F3', 'A3', 'C4', 'E4'], 'F2'),
      chord(['G3', 'B3', 'D4', 'E4'], 'G2'),
      chord(['C4', 'E4', 'G4', 'B4'], 'C2'),
    ],
    strained: [
      chord(['A3', 'C4', 'E4', 'B4'], 'A1'),
      chord(['D4', 'F4', 'A4', 'C5'], 'D2'),
      chord(['E3', 'A3', 'B3', 'D4'], 'E2'),
      chord(['A3', 'C4', 'E4', 'G4'], 'A1'),
    ],
  },
  ghent: {
    instrument: 'reed', leadSteps: [0, 3, 6], accentSteps: [2, 5], bassSteps: [0, 4],
    motif: [2, 1, 3, 0, 2, 4], noteLength: '8n.',
    clearScale: ['G4', 'A4', 'B4', 'D5', 'E5', 'G5'],
    strainedScale: ['E4', 'G4', 'A4', 'B4', 'D5', 'E5'],
    clear: [
      chord(['G3', 'B3', 'D4', 'E4'], 'G2'),
      chord(['C4', 'E4', 'G4', 'B4'], 'C2'),
      chord(['A3', 'C4', 'E4', 'G4'], 'A2'),
      chord(['D4', 'G4', 'A4', 'C5'], 'D2'),
    ],
    strained: [
      chord(['E3', 'G3', 'B3', 'F#4'], 'E2'),
      chord(['C4', 'E4', 'G4', 'B4'], 'C2'),
      chord(['A3', 'C4', 'E4', 'B4'], 'A1'),
      chord(['B3', 'E4', 'F#4', 'A4'], 'B1'),
    ],
  },
  toulouse: {
    instrument: 'warm', leadSteps: [0, 2, 4, 7], accentSteps: [1, 5], bassSteps: [0, 2, 4],
    motif: [0, 1, 3, 4, 2, 1, 5], noteLength: '8n',
    clearScale: ['Bb4', 'C5', 'D5', 'F5', 'G5', 'Bb5'],
    strainedScale: ['G4', 'A4', 'Bb4', 'C5', 'D5', 'F5'],
    clear: [
      chord(['Bb3', 'D4', 'F4', 'C5'], 'Bb2'),
      chord(['G3', 'Bb3', 'D4', 'F4'], 'G2'),
      chord(['C4', 'Eb4', 'G4', 'D5'], 'C2'),
      chord(['F3', 'A3', 'C4', 'Eb4'], 'F2'),
    ],
    strained: [
      chord(['G3', 'Bb3', 'D4', 'A4'], 'G2'),
      chord(['Eb3', 'G3', 'Bb3', 'D4'], 'Eb2'),
      chord(['C4', 'Eb4', 'G4', 'Bb4'], 'C2'),
      chord(['D4', 'G4', 'A4', 'C5'], 'D2'),
    ],
  },
  coimbra: {
    instrument: 'pluck', leadSteps: [0, 1, 4, 5, 7], accentSteps: [3, 6], bassSteps: [0, 5],
    motif: [4, 3, 1, 2, 0, 1, 4, 2], noteLength: '16n',
    clearScale: ['F4', 'G4', 'A4', 'C5', 'D5', 'F5'],
    strainedScale: ['D4', 'E4', 'F4', 'A4', 'C5', 'D5'],
    clear: [
      chord(['F3', 'A3', 'C4', 'E4'], 'F2'),
      chord(['G3', 'Bb3', 'D4', 'F4'], 'G2'),
      chord(['C4', 'F4', 'G4', 'Bb4'], 'C2'),
      chord(['F3', 'A3', 'C4', 'D4'], 'F2'),
    ],
    strained: [
      chord(['D4', 'F4', 'A4', 'E5'], 'D2'),
      chord(['Bb3', 'D4', 'F4', 'A4'], 'Bb1'),
      chord(['G3', 'Bb3', 'D4', 'F4'], 'G2'),
      chord(['A3', 'D4', 'E4', 'G4'], 'A1'),
    ],
  },
};

export function musicCondition(stress, bar = 0) {
  if (stress >= 0.66) return 'strained';
  if (stress >= 0.34 && Math.floor(bar / 2) % 2 === 1) return 'strained';
  return 'clear';
}

export function scoreFor(cityId) {
  return MUSIC_PROFILES[cityId] || MUSIC_PROFILES.ghent;
}

export function chordFor(cityId, stress, bar) {
  const profile = scoreFor(cityId);
  return profile[musicCondition(stress, bar)][bar % profile.clear.length];
}

export function melodyNote(cityId, stress, bar, phraseStep, siteSeed = 0) {
  const profile = scoreFor(cityId);
  const scale = profile[`${musicCondition(stress, bar)}Scale`];
  const variant = Math.floor(bar / 4) % 2 === 1 ? siteSeed % 2 : 0;
  return scale[profile.motif[(phraseStep + bar + variant) % profile.motif.length]];
}

export function siteSeedFromCode(code = '') {
  return Array.from(code).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
}
