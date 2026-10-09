import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, ".maestro-output");
const target = join(root, "..", "..", "docs", "screenshots");

const find = (folder) =>
  readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return find(path);
    return /^mobile-.+\.png$/.test(name) ? [path] : [];
  });

mkdirSync(target, { recursive: true });
const shots = find(source);
for (const shot of shots) copyFileSync(shot, join(target, basename(shot)));
console.log(`${String(shots.length)} capturas copiadas a docs/screenshots`);
if (shots.length === 0) process.exit(1);
