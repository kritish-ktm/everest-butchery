import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createWeatherService } from './server/weather.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: 'local-weather-api',
    configureServer(server) {
      const weather = createWeatherService({ env: { ...loadEnv(mode, process.cwd(), ''), ...process.env } });
      server.middlewares.use('/api/weather', async (req, res) => {
        const response = await weather(new Request('http://localhost/api/weather', { method: req.method }));
        res.statusCode = response.status;
        for (const [name, value] of response.headers) res.setHeader(name, value);
        res.end(await response.text());
      });
    },
  }],
}))
