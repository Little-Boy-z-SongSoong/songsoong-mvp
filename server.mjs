import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const upstream = 'https://api.enora-oah.eu';
const apiPaths = new Set(['/api/cities/all', '/api/sites/all', '/api/dashboards/city']);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
};
const cache = new Map();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/enora/')) {
      const path = url.pathname.replace('/api/enora/', '/api/');
      if (req.method !== 'GET' || !apiPaths.has(path)) {
        res.writeHead(404).end();
        return;
      }
      const saved = cache.get(path);
      if (saved && Date.now() - saved.at < 15 * 60 * 1000) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(saved.body);
        return;
      }
      const response = await fetch(`${upstream}${path}`, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
      const body = await response.text();
      cache.set(path, { at: Date.now(), body });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(body);
      return;
    }
    let file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(`${root}${sep}`) && file !== root) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = resolve(file, 'index.html');
    if (!(await stat(file).catch(() => null))?.isFile()) file = resolve(root, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' }).end(error.message);
  }
}).listen(port, () => console.log(`SongSoong listening on http://localhost:${port}`));
