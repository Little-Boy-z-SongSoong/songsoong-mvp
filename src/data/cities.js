// Presentation and musical palettes only. Sampling locations and observations
// come from the ENORA API in enora.js.
export const CITIES = [
  {
    id: 'oslo', countryCode: 'NO', name: { en: 'Oslo', vi: 'Oslo' }, bpm: 52,
    colors: { accent: '#4fc3f7', barColor: { clean: '#4fc3f7', moderate: '#00897b', severe: '#455a64' } },
  },
  {
    id: 'benevento', countryCode: 'IT', name: { en: 'Benevento', vi: 'Benevento' }, bpm: 64,
    colors: { accent: '#d4a373', barColor: { clean: '#d4a373', moderate: '#556b2f', severe: '#4a3728' } },
  },
  {
    id: 'ghent', countryCode: 'BE', name: { en: 'Ghent', vi: 'Ghent' }, bpm: 48,
    colors: { accent: '#90a4ae', barColor: { clean: '#90a4ae', moderate: '#8c7853', severe: '#3e2723' } },
  },
  {
    id: 'toulouse', countryCode: 'FR', name: { en: 'Toulouse', vi: 'Toulouse' }, bpm: 60,
    colors: { accent: '#e07a5f', barColor: { clean: '#e07a5f', moderate: '#815ac0', severe: '#4a1942' } },
  },
  {
    id: 'coimbra', countryCode: 'PT', name: { en: 'Coimbra', vi: 'Coimbra' }, bpm: 56,
    colors: { accent: '#5c8fcc', barColor: { clean: '#5c8fcc', moderate: '#e9c46a', severe: '#5c3d1e' } },
  },
];

export function getCityById(id) {
  return CITIES.find((city) => city.id === id) || CITIES[0];
}
