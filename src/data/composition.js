// A site portrait follows the published biological ratings when available.
// Nitrate has no published safety threshold here, so it must not dilute or
// override those ratings in a combined ecological character.
export const ecologicalStress = { High: 0.08, Good: 0.25, Moderate: 0.49, Poor: 0.73, Bad: 0.92 };

export function richnessLayerDensity(richness, maxRichness) {
  return richness === null ? 0.35 : Math.max(0.1, Math.min(1, richness / maxRichness));
}

export function compositionForSite(signals) {
  if (!signals.length) return null;

  const ecological = signals.filter((item) => item.kind !== 'nitrate' && item.quality);
  const nitrate = signals.find((item) => item.kind === 'nitrate');
  const richnessSignals = ecological.filter((item) => item.richness !== null);
  const basis = ecological.length ? 'ecological' : 'nitrate';

  return {
    kind: 'site',
    basis,
    date: signals.map((item) => item.date).sort().at(-1),
    stress: ecological.length
      ? ecological.reduce((sum, item) => sum + item.stress, 0) / ecological.length
      : nitrate.stress,
    layerDensity: richnessSignals.length
      ? richnessSignals.reduce((sum, item) => sum + item.layerDensity, 0) / richnessSignals.length
      : 0.4,
    signalCount: signals.length,
    ecologicalCount: ecological.length,
    percentile: nitrate?.percentile ?? null,
  };
}
