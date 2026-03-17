// CMG PM Tool — Frontend static server + /api proxy
const http = require('http');
const fs   = require('fs');
const path = require('path');

const DIST     = path.join(__dirname, 'frontend', 'dist');
const PORT     = 4173;
const API_HOST = '127.0.0.1';
const API_PORT = 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

function serveFile(filePath, res, noCache = false) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': mime };
    // index.html and SPA fallback: never cache (always revalidate)
    if (noCache || path.basename(filePath) === 'index.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else {
      // Hashed assets: cache aggressively
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

function proxyApi(req, res) {
  const opts = {
    hostname: API_HOST, port: API_PORT,
    path: req.url, method: req.method,
    headers: { ...req.headers, host: `${API_HOST}:${API_PORT}` },
  };
  const proxy = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  proxy.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `API proxy: ${e.message}` }));
  });
  req.pipe(proxy);
}

const server = http.createServer((req, res) => {
  const reqPath = req.url.split('?')[0];

  // Proxy /api/* to backend
  if (reqPath.startsWith('/api')) {
    return proxyApi(req, res);
  }

  // Serve static file
  let filePath = path.join(DIST, reqPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403); res.end(); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || stat.isDirectory()) {
      // SPA fallback → index.html
      serveFile(path.join(DIST, 'index.html'), res);
    } else {
      serveFile(filePath, res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CMG PM Frontend listening on 0.0.0.0:${PORT}`);
});

server.on('error', (e) => {
  console.error('Server error:', e.message);
  process.exit(1);
});
