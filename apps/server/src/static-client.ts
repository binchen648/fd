import { createReadStream, realpathSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };

export function staticClient(root: string) {
  const directory = realpathSync(root);
  // Fail startup if a production build was not supplied, instead of publishing
  // a source directory or returning a misleading healthy blank page.
  if (!statSync(resolve(directory, 'index.html')).isFile()) throw new Error('Client build index missing');
  return (request: IncomingMessage, response: ServerResponse, pathname: string): boolean => {
    if (!['GET', 'HEAD'].includes(request.method ?? '')) return false;
    let file: string;
    try {
      const decoded = decodeURIComponent(pathname);
      if (decoded.includes('\0') || decoded.split(/[\\/]/).some(part => part.startsWith('.'))) return false;
      const candidate = resolve(directory, '.' + (decoded === '/' ? '/index.html' : decoded));
      if (!candidate.startsWith(directory + sep)) return false;
      file = realpathSync(candidate);
      if (!file.startsWith(directory + sep) || !mime[extname(file).toLowerCase()]) return false;
      const stat = statSync(file); if (!stat.isFile()) return false;
      response.writeHead(200, { 'content-type': mime[extname(file).toLowerCase()]!, 'content-length': stat.size, 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' });
    } catch { return false; }
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).on('error', () => response.destroy()).pipe(response);
    return true;
  };
}
