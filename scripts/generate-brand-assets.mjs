import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = (file) => join(root, "brand", file);
const web = (file) => join(root, "apps/web/public", file);
const mobile = (file) => join(root, "apps/mobile/assets", file);

const BRAND_COLOR = "#4f46e5";

const svg = async (file) => readFile(brand(file));

const rasterize = (source, size) =>
  sharp(source, { density: Math.ceil((size / 64) * 72 * 2) })
    .resize(size, size)
    .png()
    .toBuffer();

const save = (image, target) =>
  sharp(image).png({ compressionLevel: 9, palette: false }).toFile(target);

const centered = async (source, canvas, ratio, background) => {
  const markSize = Math.round(canvas * ratio);
  const mark = await rasterize(source, markSize);
  const offset = Math.round((canvas - markSize) / 2);
  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, top: offset, left: offset }])
    .png()
    .toBuffer();
};

const icon = await svg("icon.svg");
const mark = await svg("mark.svg");
const monochrome = await svg("mark-monochrome.svg");

await mkdir(web(""), { recursive: true });
await copyFile(brand("favicon.svg"), web("favicon.svg"));
await save(await rasterize(icon, 32), web("favicon-32.png"));
await save(await rasterize(icon, 192), web("icon-192.png"));
await save(await rasterize(icon, 512), web("icon-512.png"));
await save(await centered(mark, 180, 0.62, BRAND_COLOR), web("apple-touch-icon.png"));
await save(await centered(mark, 512, 0.56, BRAND_COLOR), web("icon-maskable-512.png"));

await save(await centered(mark, 1024, 0.62, BRAND_COLOR), mobile("icon.png"));
await save(await centered(mark, 1024, 0.5), mobile("android-icon-foreground.png"));
await save(await centered(monochrome, 1024, 0.5), mobile("android-icon-monochrome.png"));
await save(await centered(mark, 1024, 0.9), mobile("splash-icon.png"));
await save(await rasterize(icon, 48), mobile("favicon.png"));
await rm(mobile("android-icon-background.png"), { force: true });

console.log("Brand assets generated");
