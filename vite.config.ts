import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();
        const query = Object.fromEntries(url.searchParams);
        let pathname = url.pathname;
        const cancelMatch = pathname.match(/^\/api\/pay\/cancel\/([^/]+)$/);
        if (cancelMatch) {
          pathname = '/api/pay/cancel';
          query.invoice = decodeURIComponent(cancelMatch[1]);
        }
        const file = path.resolve(process.cwd(), `${pathname.slice(1)}.js`);
        try {
          const mod = await server.ssrLoadModule(file);
          req.query = query;
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (body) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(body));
          };
          res.redirect = (location) => {
            res.statusCode = 302;
            res.setHeader('Location', location);
            res.end();
          };
          await mod.default(req, res);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'API error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [react(), devApi()],
  };
});
