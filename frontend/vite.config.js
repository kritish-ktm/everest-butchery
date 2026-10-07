import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createWeatherService } from './server/weather.js'
import { createOrderService } from './server/orders.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build: { manifest: true },
  plugins: [react(), {
    name: 'local-weather-api',
    configureServer(server) {
      const weather = createWeatherService({ env: { ...loadEnv(mode, process.cwd(), ''), ...process.env } });
      const orders = createOrderService({ env: { ...loadEnv(mode, process.cwd(), ''), ...process.env } });
      server.middlewares.use('/api/orders', async (req, res) => {
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 32000) { res.statusCode = 413; res.end('{"error":"Order is too large."}'); return; }
        }
        const response = await orders(new Request(`http://localhost/api/orders${req.url || ''}`, {
          method: req.method, headers: { authorization: req.headers.authorization || '' },
          ...(req.method === 'POST' ? { body } : {}),
        }));
        res.statusCode = response.status;
        for (const [name, value] of response.headers) res.setHeader(name, value);
        res.end(await response.text());
      });
      server.middlewares.use('/api/weather', async (req, res) => {
        const response = await weather(new Request('http://localhost/api/weather', { method: req.method }));
        res.statusCode = response.status;
        for (const [name, value] of response.headers) res.setHeader(name, value);
        res.end(await response.text());
      });
    },
  }],
}))
