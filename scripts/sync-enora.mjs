import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = 'https://api.enora-oah.eu';
const endpoints = {
  cities: '/api/cities/all',
  sites: '/api/sites/all',
  observations: '/api/dashboards/city',
};
const destination = resolve('src/data/enoraSnapshot.json');

async function readEndpoint(path) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error(`${path}: expected an array`);
  return data;
}

try {
  const [cities, sites, observations] = await Promise.all(Object.values(endpoints).map(readEndpoint));
  if (cities.length < 5 || sites.length < 50 || observations.length < 50) {
    throw new Error('The API returned an incomplete dataset');
  }
  await mkdir(resolve('src/data'), { recursive: true });
  await writeFile(destination, `${JSON.stringify({ fetchedAt: new Date().toISOString(), cities, sites, observations })}\n`);
  console.log(`Saved ${cities.length} cities, ${sites.length} sites and ${observations.length} observations.`);
} catch (error) {
  try {
    await readFile(destination);
    console.warn(`ENORA refresh unavailable; using the committed snapshot. ${error.message}`);
  } catch {
    console.error(error);
    process.exitCode = 1;
  }
}
