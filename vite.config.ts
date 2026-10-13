import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cors-proxy-middleware',
      configureServer(server) {
        server.middlewares.use('/api-proxy', async (req, res) => {
          const urlParam = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('url');
          if (!urlParam) {
            res.statusCode = 400;
            res.end('Missing target url query parameter');
            return;
          }
          try {
            const bodyChunks: Buffer[] = [];
            for await (const chunk of req) {
              bodyChunks.push(chunk);
            }
            const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;

            const fetchHeaders: Record<string, string> = {};
            if (req.headers['content-type']) {
              fetchHeaders['Content-Type'] = req.headers['content-type'];
            }

            const upstreamRes = await fetch(urlParam, {
              method: req.method,
              headers: fetchHeaders,
              body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
            });

            res.statusCode = upstreamRes.status;
            res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
            const data = await upstreamRes.arrayBuffer();
            res.end(Buffer.from(data));
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});
