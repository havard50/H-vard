import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3333";
const outDir = path.resolve(__dirname, "..", ".qa-screenshots", "phase10");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { name: "home-trio", url: "/", selector: "#trio", scroll: true },
  { name: "home-live", url: "/#shows", selector: "#shows", scroll: true },
  { name: "live", url: "/live.html", selector: "#live-upcoming", scroll: false },
  { name: "gig", url: "/gigs/inni-granskauen-fest-2026.html", selector: ".gig-detail__layout", scroll: false },
  { name: "news", url: "/news.html", selector: "#news-latest", scroll: false }
];

const viewports = [
  { w: 1440, h: 900 },
  { w: 1366, h: 768 },
  { w: 1280, h: 800 },
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 430, h: 932 },
  { w: 390, h: 844 },
  { w: 375, h: 812 }
];

function measure(page) {
  return page.evaluate(() => {
    const poster = document.querySelector(".home-trio__media img, .gig-detail__poster");
    const copy = document.querySelector(".home-trio__content, .gig-detail__body");
    const pr = poster ? poster.getBoundingClientRect() : null;
    const cr = copy ? copy.getBoundingClientRect() : null;
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      poster: pr
        ? {
            w: Math.round(pr.width),
            h: Math.round(pr.height),
            objectFit: getComputedStyle(poster).objectFit
          }
        : null,
      copyVisible: cr ? Math.round(cr.width) : null,
      nextShow: document.querySelector("#hero-next-show")?.textContent?.trim() || null,
      liveRows: [...document.querySelectorAll(".tour-row, .tour-page-row")].slice(0, 3).map((el) => el.textContent.replace(/\s+/g, " ").trim())
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = { targets: {}, checks: [] };

for (const target of targets) {
  report.targets[target.name] = {};
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto(`${baseUrl.replace(/\/$/, "")}${target.url}`, {
      waitUntil: "networkidle",
      timeout: 60000
    });
    await page.waitForTimeout(1200);
    if (target.scroll && target.selector) {
      await page.locator(target.selector).scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(400);
    }
    const metrics = await measure(page);
    report.targets[target.name][`${vp.w}x${vp.h}`] = metrics;
    const shot = `${target.name}-${vp.w}x${vp.h}.png`;
    await page.screenshot({
      path: path.join(outDir, shot),
      fullPage: target.name.startsWith("home")
    });
    if (metrics.overflow) {
      report.checks.push(`overflow:${target.name}@${vp.w}x${vp.h}`);
    }
    if (metrics.poster && metrics.poster.objectFit !== "contain") {
      report.checks.push(`object-fit:${target.name}@${vp.w}x${vp.h}=${metrics.poster.objectFit}`);
    }
    if (vp.w >= 960 && metrics.poster && metrics.poster.w > 480) {
      report.checks.push(`poster-wide:${target.name}@${vp.w}x${vp.h}=${metrics.poster.w}px`);
    }
  }
}

fs.writeFileSync(path.join(outDir, "phase10-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
