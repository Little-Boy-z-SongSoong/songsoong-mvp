# SongSoong

An interactive river soundscape built from published ENORA observations. Select a city and sampling site to hear a composition built from its available ecological signals. Isolate each signal to hear its contribution. The interface defaults to Vietnamese and supports English.

## Run locally

```bash
npm install
npm run dev
```

Vite proxies `/api/enora/*` to the public ENORA API. The development URL is `http://localhost:5173`.

## Build and serve

```bash
npm run build
npm start
```

The build refreshes `src/data/enoraSnapshot.json` from `/api/cities/all`, `/api/sites/all`, and `/api/dashboards/city`. If the upstream API is unavailable at build time, it retains the previous snapshot. The Node server serves `dist`, proxies those three GET routes under `/api/enora/*`, and caches upstream responses for 15 minutes. Set `PORT` to change its default port of 4173.

On a static host, the page can still display the bundled snapshot, but the live API badge and refresh require a same-origin proxy for those routes because the upstream API rejects direct browser cross-origin requests.

## Deploy on Vercel

`vercel.json` builds the Vite app and rewrites the three `/api/enora/*` reads to their matching ENORA endpoints. Vercel serves the static `dist` directory; `server.mjs` remains available for local or Node hosting. When a Vercel project is linked to this GitHub repository, pushes to the production branch can deploy automatically.

## Data and imagery

Fish, invertebrate and diatom ratings select a harmonic mood. Their recorded richness changes the density of water-drop accents. Nitrate is shown with its exact published value; its relative rank in the retrieved dataset informs musical tension because the API schema does not specify a unit or safety threshold. The default site composition averages available signals, which may come from different observation dates. This is an artistic rule rather than an official water-quality score. The musical mapping is an interpretation of historical records, not a live measurement or water-safety diagnosis.

The sound engine uses consonant city-specific chord progressions, a short lead melody, soft bass, subtle water accents and eight-bar phrasing. A deterministic motif derived from the site code gives each site a repeatable musical identity. Higher musical tension now shifts toward a reflective minor mood and warmer filtering instead of harsh distortion.

Only the five field photographs in `public-live/photos/` are included in the production build. Their original URLs and source pages are recorded in [PHOTO_SOURCES.md](PHOTO_SOURCES.md). The photos depict the city area and are not presented as photos of each selected sampling site.
