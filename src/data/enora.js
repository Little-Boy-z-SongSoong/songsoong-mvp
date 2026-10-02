import snapshot from './enoraSnapshot.json';
export { compositionForSite } from './composition';

const paths = {
  cities: '/api/enora/cities/all',
  sites: '/api/enora/sites/all',
  observations: '/api/enora/dashboards/city',
};

export const fallbackOverview = { ...snapshot, source: 'snapshot' };

export async function fetchOverview() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const entries = await Promise.all(Object.entries(paths).map(async ([name, path]) => {
      const response = await fetch(path, { signal: controller.signal });
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error(`${path}: invalid data`);
      return [name, data];
    }));
    const result = Object.fromEntries(entries);
    if (result.cities.length < 5 || result.sites.length < 50 || result.observations.length < 50) {
      throw new Error('The response is incomplete');
    }
    return { ...result, fetchedAt: new Date().toISOString(), source: 'api' };
  } finally {
    clearTimeout(timeout);
  }
}

export const CITY_PRESENTATION = {
  oslo: {
    apiId: 'OS', photo: '/photos/oslo-stream.jpg', source: 'https://www.oneaquahealth.eu/research-cities/oslo/',
    photoAlt: { en: 'A snowy stream in Oslo', vi: 'Dòng suối mùa đông ở Oslo' },
  },
  benevento: {
    apiId: 'BE', photo: '/photos/benevento.jpg', source: 'https://www.oneaquahealth.eu/research-cities/benevento/',
    photoAlt: { en: 'A stream sampling area in Benevento', vi: 'Dòng suối ở khu vực nghiên cứu Benevento' },
  },
  ghent: {
    apiId: 'GH', photo: '/photos/ghent.jpg', source: 'https://www.oneaquahealth.eu/research-cities/ghent/',
    photoAlt: { en: 'A tree-lined waterway near Ghent', vi: 'Dòng nước ven hàng cây gần Ghent' },
  },
  toulouse: {
    apiId: 'TO', photo: '/photos/toulouse.jpg', source: 'https://www.oneaquahealth.eu/research-cities/toulouse/',
    photoAlt: { en: 'A research waterway in Toulouse', vi: 'Dòng nước trong khu vực nghiên cứu Toulouse' },
  },
  coimbra: {
    apiId: 'CO', photo: '/photos/coimbra.jpg', source: 'https://www.oneaquahealth.eu/research-cities/coimbra/',
    photoAlt: { en: 'A stream at Vale das Flores, Coimbra', vi: 'Dòng suối Vale das Flores, Coimbra' },
  },
};

const signalFields = [
  { kind: 'fish', quality: 'fishQuality', richness: 'fishRichness' },
  { kind: 'macro', quality: 'macroinvertebratesQuality', richness: 'macroinvertebratesRichness' },
  { kind: 'diatoms', quality: 'diatomsQuality', richness: 'diatomsRichness' },
  { kind: 'nitrate', value: 'nitrate' },
];

const qualityStress = { High: 0.08, Good: 0.25, Moderate: 0.49, Poor: 0.73, Bad: 0.92 };

export function observationsForSite(overview, code) {
  return overview.observations
    .filter((row) => row.siteCode === code)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export function signalsForSite(overview, code) {
  const rows = observationsForSite(overview, code);
  const nitrates = overview.observations.map((row) => row.nitrate).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  return signalFields.flatMap((field) => {
    const row = rows.find((item) => field.value ? Number.isFinite(item[field.value]) : item[field.quality]);
    if (!row) return [];
    if (field.value) {
      const percentile = nitrates.length > 1 ? nitrates.filter((value) => value <= row.nitrate).length / nitrates.length : 0.5;
      return [{ kind: field.kind, id: row.id, date: row.date, value: row.nitrate,
        stress: 0.1 + 0.8 * percentile, percentile, richness: null, layerDensity: 0.4, isRelative: true }];
    }
    const richness = Number.isFinite(row[field.richness]) ? row[field.richness] : null;
    const categoryRichness = overview.observations.map((item) => item[field.richness]).filter((value) => Number.isFinite(value));
    const maxRichness = Math.max(1, ...categoryRichness);
    return [{ kind: field.kind, id: row.id, date: row.date, quality: row[field.quality], richness,
      stress: qualityStress[row[field.quality]] ?? 0.5,
      layerDensity: richness === null ? 0.35 : Math.max(0.1, Math.min(1, richness / maxRichness)) }];
  });
}

export function siteOptions(overview, cityId) {
  const apiId = CITY_PRESENTATION[cityId].apiId;
  return overview.sites.filter((site) => site.city?.id === apiId)
    .map((site) => ({ ...site, signalCount: signalsForSite(overview, site.code).length }))
    .sort((a, b) => b.signalCount - a.signalCount || a.name.localeCompare(b.name));
}

export function citySummary(overview, cityId) {
  const sites = siteOptions(overview, cityId);
  const codes = new Set(sites.map((site) => site.code));
  const observations = overview.observations.filter((row) => codes.has(row.siteCode));
  const dates = observations.map((row) => row.date).sort();
  return { sites: sites.length, observations: observations.length, latestDate: dates.at(-1) || null };
}

export function formatObservationDate(date, lang) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}

export function qualityTone(quality) {
  if (quality === 'High' || quality === 'Good') return 'gentle';
  if (quality === 'Moderate') return 'shifting';
  return 'tense';
}
