/**
 * Phase 9 final — default homepage QA (no body classes).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".qa-screenshots", "phase9-final");
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3333";

const viewports = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "430x932", width: 430, height: 932 },
  { name: "390x844", width: 390, height: 844 },
  { name: "375x812", width: 375, height: 812 }
];

fs.mkdirSync(outDir, { recursive: true });

function measure(page) {
  return page.evaluate(() => {
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const hero = document.querySelector(".home-hero");
    const h1 = document.querySelector(".home-hero__title");
    const raw = document.querySelector(".home-hero__raw");
    const bgImg = document.querySelector(".home-hero__bg-img");
    const photoBreak = document.querySelector(".home-photo-break__link img");
    const aboutImg = document.querySelector(".home-about-photo img");

    return {
      heroHeight: hero ? Math.round(rect(hero).height) : null,
      h1FontSize: h1 ? cs(h1).fontSize : null,
      h1Height: h1 ? Math.round(rect(h1).height) : null,
      rawFontSize: raw ? cs(raw).fontSize : null,
      bgObjectPosition: bgImg ? cs(bgImg).objectPosition : null,
      bgAnimation: bgImg ? cs(bgImg).animationName : null,
      bgTransform: bgImg ? cs(bgImg).transform : null,
      photoBreakHeight: photoBreak ? Math.round(rect(photoBreak).height) : null,
      photoBreakObjectPosition: photoBreak ? cs(photoBreak).objectPosition : null,
      aboutPhoto: aboutImg
        ? { w: Math.round(rect(aboutImg).width), h: Math.round(rect(aboutImg).height) }
        : null,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      bodyClasses: document.body.className
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = {
  generatedAt: new Date().toISOString(),
  measurements: {},
  consoleErrors: []
};

page.on("pageerror", (err) => report.consoleErrors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") report.consoleErrors.push(msg.text());
});

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.querySelectorAll(".home-reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  });
  report.measurements[vp.name] = await measure(page);
  await page.screenshot({
    path: path.join(outDir, `homepage-${vp.name}.png`),
    fullPage: false
  });
  if (vp.name === "1366x768") {
    await page.screenshot({
      path: path.join(outDir, "homepage-1366x768-full.png"),
      fullPage: true
    });
    const photoEl = await page.$("#gallery");
    if (photoEl) {
      await photoEl.scrollIntoViewIfNeeded();
      await photoEl.screenshot({ path: path.join(outDir, "photobreak-1366x768.png") });
    }
  }
  console.log(vp.name, report.measurements[vp.name]);
}

report.contentLock =
  execSync("git status --porcelain assets/content.json", { cwd: root }).toString().trim() === "";
report.seoLock = {
  title: fs.readFileSync(path.join(root, "index.html"), "utf8").includes(
    "Håvard Pedersen — Norwegian guitarist"
  ),
  canonical: fs.readFileSync(path.join(root, "index.html"), "utf8").includes(
    'rel="canonical" href="https://www.havardpedersen.com/"'
  )
};

fs.writeFileSync(path.join(outDir, "phase9-final-report.json"), JSON.stringify(report, null, 2));
await browser.close();
console.log("Final QA:", outDir);
