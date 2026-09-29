import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "");
const siteUrl = (env.VITE_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "")
  .replace(/\/$/, "")
  .replace(/^([^:]+)$/i, "https://$1");

const output = resolve("dist");
await mkdir(output, { recursive: true });

const robots = ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /admin-login", "Disallow: /cart", "Disallow: /checkout", "Disallow: /order-confirmation"];
if (siteUrl) robots.push(`Sitemap: ${siteUrl}/sitemap.xml`);
await writeFile(resolve(output, "robots.txt"), `${robots.join("\n")}\n`);

if (siteUrl) {
  const paths = ["/", "/menu", "/about", "/contact", "/dashain-offers"];
  const entries = paths.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  await writeFile(resolve(output, "sitemap.xml"), sitemap);
}
