/**
 * Run before manual upload to one.com: npm run deploy:check
 * Netlify deploys the whole publish folder every time; manual FTP often misses nested files or dotfiles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const REQUIRED_ROOT = [
  "index.html",
  "shop.html",
  ".htaccess",
  "robots.txt",
  "sitemap.xml",
];

const REQUIRED_ASSETS = [
  ".htaccess",
  "styles.css",
  "main.js",
  "content.json",
  "admin.js",
];

function ok(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/** Every string value starting with /assets/ (images, JSON URLs). */
function walkAssetRefs(obj, out = []) {
  if (typeof obj === "string") {
    if (obj.startsWith("/assets/")) out.push(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((x) => walkAssetRefs(x, out));
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) walkAssetRefs(v, out);
  }
  return out;
}

let errors = 0;

console.log("=== Required root files ===\n");
for (const rel of REQUIRED_ROOT) {
  const full = path.join(root, rel);
  if (!ok(full)) {
    console.error("MISSING:", rel);
    errors++;
  } else {
    console.log("OK     ", rel);
  }
}

console.log("\n=== Required assets/ files ===\n");
for (const rel of REQUIRED_ASSETS) {
  const full = path.join(root, "assets", rel);
  if (!ok(full)) {
    console.error("MISSING:", "assets/" + rel);
    errors++;
  } else {
    console.log("OK     ", "assets/" + rel);
  }
}

const contentPath = path.join(root, "assets", "content.json");
if (ok(contentPath)) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  } catch (e) {
    console.error("BAD JSON assets/content.json:", e.message);
    errors++;
    data = null;
  }
  if (data) {
    const refs = [...new Set(walkAssetRefs(data))].sort();
    console.log("\n=== Paths referenced in content.json ===\n");
    for (const ref of refs) {
      const disk = path.join(root, ref.replace(/^\//, ""));
      if (!ok(disk)) {
        console.error("MISSING:", ref);
        errors++;
      } else {
        console.log("OK     ", ref);
      }
    }
  }
}

const imagesDir = path.join(root, "assets", "images");
console.log("\n=== assets/images ===\n");
if (!ok(imagesDir)) {
  console.error("MISSING: assets/images folder (hero, gallery, OG images will 404)");
  errors++;
} else {
  const files = fs.readdirSync(imagesDir);
  console.log("OK      ", files.length, "file(s) in assets/images/");
  if (files.length === 0) {
    console.warn("WARN    folder is empty — site will look broken without PNGs/JPEGs");
    errors++;
  }
}

console.log(
  errors
    ? "\nFix issues above, then upload again. Common one.com gaps: forgot assets/.htaccess, forgot images, skipped subfolders, or .htaccess hidden in file manager.\n"
    : "\nLooks complete locally. Upload the SAME tree to one.com web root (overwrite entire assets/). Enable “show hidden files” for .htaccess.\n"
);

process.exit(errors ? 1 : 0);
