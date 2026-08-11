import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3333";

const pages = [
  "/",
  "/live.html",
  "/music.html",
  "/video.html",
  "/bio.html",
  "/news.html",
  "/epk.html",
  "/contact.html",
  "/press.html",
  "/shop.html",
  "/gigs/inni-granskauen-fest-2026.html"
];

const forbiddenTargets = ["interviews.html", "reviews.html"];

function collectInternalHrefs(html, fromPath) {
  const hrefs = [];
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (href.startsWith("http") && !href.includes("127.0.0.1") && !href.includes("localhost")) continue;
    if (href.startsWith("#")) {
      const id = href.slice(1);
      if (id && !html.includes(`id="${id}"`)) {
        hrefs.push({ from: fromPath, href, issue: "missing anchor" });
      }
      continue;
    }
    for (const bad of forbiddenTargets) {
      if (href.includes(bad)) {
        hrefs.push({ from: fromPath, href, issue: "forbidden legacy target" });
      }
    }
    if (href.startsWith("/") || !href.includes("://")) {
      const normalized = href.startsWith("/") ? href.split("#")[0] : path.posix.join(path.posix.dirname(fromPath), href.split("#")[0]);
      hrefs.push({ from: fromPath, href: normalized || href, issue: null });
    }
  }
  return hrefs;
}

const errors = [];
const checked = new Set();

for (const page of pages) {
  const url = baseUrl.replace(/\/$/, "") + (page === "/" ? "/" : page);
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    errors.push({ page, issue: "fetch failed", detail: String(e) });
    continue;
  }
  if (!res.ok) {
    errors.push({ page, issue: "HTTP " + res.status });
    continue;
  }
  const html = await res.text();
  if (html.includes("<title>") && html.length < 200) {
    errors.push({ page, issue: "suspiciously short page" });
  }
  const links = collectInternalHrefs(html, page);
  for (const link of links) {
    if (link.issue) {
      errors.push({ page: link.from, href: link.href, issue: link.issue });
      continue;
    }
    const target = link.href;
    if (!target || target === "/" || checked.has(target)) continue;
    checked.add(target);
    if (target.endsWith(".png") || target.endsWith(".jpg") || target.endsWith(".mp4") || target.endsWith(".json")) continue;
    const targetUrl = baseUrl.replace(/\/$/, "") + target;
    try {
      const r2 = await fetch(targetUrl);
      if (!r2.ok) errors.push({ page: link.from, href: target, issue: "HTTP " + r2.status });
    } catch (e) {
      errors.push({ page: link.from, href: target, issue: "fetch failed", detail: String(e) });
    }
  }
}

const reportPath = path.join(root, ".qa-screenshots", "link-qa-report.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ baseUrl, errors, checked: [...checked] }, null, 2));

if (errors.length) {
  console.error("Link QA failed:", errors.length, "issue(s)");
  errors.forEach((e) => console.error(e));
  process.exit(1);
}
console.log("Link QA passed —", checked.size, "internal targets checked");
console.log("Report:", reportPath);
