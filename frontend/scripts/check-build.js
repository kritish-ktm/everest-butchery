import { readFileSync, statSync } from "node:fs";
import assert from "node:assert/strict";

const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry && manifest[key].src === "index.html");
assert.ok(entry, "Production entry missing from Vite manifest");
const seen = new Set();
function initialBytes(key) {
  if (seen.has(key)) return 0;
  seen.add(key);
  const chunk = manifest[key];
  // Manifest imports are static dependencies; dynamicImports stay on demand.
  return statSync(`dist/${chunk.file}`).size + (chunk.imports || []).reduce((sum, dependency) => sum + initialBytes(dependency), 0);
}
const bytes = initialBytes(entry);
assert.ok(bytes < 500_000, `Initial JS exceeds 500 KB budget: ${bytes}`);
assert.ok(statSync("src/assets/storefront-1092.webp").size < 100_000, "Desktop storefront exceeds 100 KB");
assert.ok(statSync("src/assets/storefront-640.webp").size < 40_000, "Mobile storefront exceeds 40 KB");
console.log(`Initial JavaScript: ${(bytes / 1000).toFixed(1)} KB. Storefront image budgets passed.`);
