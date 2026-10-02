import { ecologicalStress, richnessLayerDensity } from './composition.js';

const examples = [
  { key: 'A', code: 'C17', recordId: 786, quality: 'Good' },
  { key: 'B', code: 'C20', recordId: 790, quality: 'Poor' },
];

function pairFrom(overview) {
  const maxRichness = Math.max(1, ...overview.observations.map((item) => item.macroinvertebratesRichness).filter(Number.isFinite));
  const clips = examples.map((example) => {
    const row = overview.observations.find((item) => item.id === example.recordId && item.siteCode === example.code);
    const site = overview.sites.find((item) => item.code === example.code);
    if (!row || !site || !Number.isFinite(row.macroinvertebratesRichness) || row.macroinvertebratesQuality !== example.quality ||
        !row.date.startsWith('2023-06-06') || site.city?.id !== 'CO') return null;
    const signal = {
      kind: 'macro', quality: row.macroinvertebratesQuality,
      richness: row.macroinvertebratesRichness, date: row.date,
      stress: ecologicalStress[row.macroinvertebratesQuality],
      layerDensity: richnessLayerDensity(row.macroinvertebratesRichness, maxRichness),
    };
    return { ...example, site, row, signal };
  });
  return clips.every(Boolean) ? clips : null;
}

export function listeningChallengePair(overview, fallbackOverview) {
  return pairFrom(overview) || pairFrom(fallbackOverview);
}
