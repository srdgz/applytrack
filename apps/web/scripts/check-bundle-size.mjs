import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 200;

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const manifest = JSON.parse(readFileSync(join(dist, ".vite", "manifest.json"), "utf8"));

const initial = new Set();
const visit = (key) => {
  const chunk = manifest[key];
  if (!chunk || initial.has(chunk.file)) return;
  initial.add(chunk.file);
  for (const imported of chunk.imports ?? []) visit(imported);
};

for (const [key, chunk] of Object.entries(manifest)) {
  if (chunk.isEntry) visit(key);
}

const sizes = [...initial]
  .filter((file) => file.endsWith(".js"))
  .map((file) => ({ file, kb: gzipSync(readFileSync(join(dist, file))).length / 1024 }));
const total = sizes.reduce((sum, { kb }) => sum + kb, 0);

for (const { file, kb } of sizes) console.log(`${kb.toFixed(1).padStart(7)} KB  ${file}`);
console.log(`${total.toFixed(1).padStart(7)} KB  total gzip (presupuesto ${String(BUDGET_KB)} KB)`);

if (total > BUDGET_KB) {
  console.error(
    `El JavaScript inicial supera el presupuesto en ${(total - BUDGET_KB).toFixed(1)} KB.`,
  );
  process.exit(1);
}
