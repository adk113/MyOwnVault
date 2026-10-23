import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const isAsset = filePath.includes(path.sep + 'assets' + path.sep);

    const headers = {
      ...HEADERS,
      'Content-Type': contentType,
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
    };

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Server Error: file not found or build missing.');
        return;
      }
      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MyOwnVault production server running on port ${PORT}`);
});
