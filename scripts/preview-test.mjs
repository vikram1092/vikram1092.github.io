// Small static server for testing the exact production output, without a dev transform.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const types = { '.svg': 'image/svg+xml', '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const path = resolve(root, '.' + decodeURIComponent(url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname));
  if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    const data = await readFile(path);
    const headers = { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
    // Safari probes videos with byte-range requests; match Pages' media serving
    // behavior so production video playback can be tested locally too.
    if (request.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      const start = range?.[1] ? Number(range[1]) : Math.max(0, data.length - Number(range?.[2]));
      const end = range?.[1] && range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      if (!range || (!range[1] && !range[2]) || start > end || start >= data.length) {
        response.writeHead(416, { ...headers, 'Content-Range': `bytes */${data.length}` }).end();
        return;
      }
      response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Content-Length': end - start + 1 });
      response.end(request.method === 'HEAD' ? undefined : data.subarray(start, end + 1));
    } else {
      response.writeHead(200, { ...headers, 'Content-Length': data.length }).end(request.method === 'HEAD' ? undefined : data);
    }
  } catch { response.writeHead(404).end(); }
}).listen(4321, '127.0.0.1');
