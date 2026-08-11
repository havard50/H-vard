/**
 * Phase 9 — Homepage proportion visual QA
 * Captures 1366×768 comparisons, multi-viewport mobile QA, measurements.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".qa-screenshots", "phase9");
const localUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3333";
const prodUrl = "https://www.havardpedersen.com";

const LAPTOP = { width: 1366, height: 768 };
const viewports = [
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "430x932", width: 430, height: 932 },
  { name: "390x844", width: 390, height: 844 },
  { name: "375x812", width: 375, height: 812 }
];

const interiorPages = ["bio", "news", "press", "epk", "music", "video", "shop"];

fs.mkdirSync(outDir, { recursive: true });

function measureHomepage(page) {
  return page.evaluate(() => {
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const hero = document.querySelector(".home-hero");
    const h1 = document.querySelector(".home-hero__title");
    const raw = document.querySelector(".home-hero__raw");
    const bgImg = document.querySelector(".home-hero__bg-img");
    const portrait = document.querySelector(".home-hero__portrait img");
    const photoBreak = document.querySelector(".home-photo-break__link img");
    const photoStrip = document.querySelector(".home-photo-strip__inner");
    const aboutImg = document.querySelector(".home-about-photo img");
    const shell = document.querySelector(".home-shell");
    const cta = document.querySelector(".home-hero__actions .home-btn--primary");

    const bgRect = bgImg ? rect(bgImg) : null;
    const portraitEl = document.querySelector(".home-hero__portrait");
    const portraitVisible =
      portraitEl && portraitEl.offsetParent !== null && getComputedStyle(portraitEl).display !== "none";
    const portraitRect = portrait && portraitVisible ? rect(portrait) : null;

    return {
      heroHeight: hero ? Math.round(rect(hero).height) : null,
      h1FontSize: h1 ? cs(h1).fontSize : null,
      h1Height: h1 ? Math.round(rect(h1).height) : null,
      rawFontSize: raw ? cs(raw).fontSize : null,
      rawHeight: raw ? Math.round(rect(raw).height) : null,
      bgImage: bgImg
        ? {
            width: bgRect ? Math.round(bgRect.width) : null,
            height: bgRect ? Math.round(bgRect.height) : null,
            objectFit: cs(bgImg).objectFit,
            objectPosition: cs(bgImg).objectPosition,
            transform: cs(bgImg).transform,
            animation: cs(bgImg).animationName
          }
        : null,
      portrait: portraitRect
        ? {
            width: Math.round(portraitRect.width),
            height: Math.round(portraitRect.height),
            objectFit: cs(portrait).objectFit,
            objectPosition: cs(portrait).objectPosition
          }
        : null,
      photoBreak: photoBreak
        ? {
            height: Math.round(rect(photoBreak).height),
            objectPosition: cs(photoBreak).objectPosition
          }
        : null,
      photoStrip: photoStrip
        ? { height: Math.round(rect(photoStrip).height) }
        : null,
      aboutPhoto: aboutImg
        ? {
            width: Math.round(rect(aboutImg).width),
            height: Math.round(rect(aboutImg).height)
          }
        : null,
      cta: cta
        ? {
            width: Math.round(rect(cta).width),
            height: Math.round(rect(cta).height),
            fontSize: cs(cta).fontSize
          }
        : null,
      contentMaxWidth: shell ? cs(shell).maxWidth : null,
      bodyClasses: document.body.className,
      scrollHeight: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  });
}

function measureInterior(page) {
  return page.evaluate(() => {
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const h1 = document.querySelector("h1");
    const hero = document.querySelector(".site-page__hero");
    const heroImg = document.querySelector(
      ".site-page__hero-figure img, .video-featured video, .video-featured .yt-lazy, .shop-simple__art img, .music-release--latest img, .bio-block img, .news-editorial__figure img"
    );
    return {
      h1: h1 ? { fontSize: cs(h1).fontSize, height: Math.round(rect(h1).height) } : null,
      hero: hero ? { height: Math.round(rect(hero).height) } : null,
      mainImage: heroImg
        ? { w: Math.round(rect(heroImg).width), h: Math.round(rect(heroImg).height) }
        : null,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  });
}

async function capture(page, url, file, viewport, bodyClasses = []) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  if (bodyClasses.length) {
    await page.evaluate((classes) => {
      document.body.classList.add(...classes);
    }, bodyClasses);
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => {
    document.querySelectorAll(".home-reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, file), fullPage: false });
  console.log("Saved", file);
}

async function captureFull(page, url, file, viewport, bodyClasses = []) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  if (bodyClasses.length) {
    await page.evaluate((classes) => {
      document.body.classList.add(...classes);
    }, bodyClasses);
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => {
    document.querySelectorAll(".home-reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  console.log("Saved", file);
}

function setupAca52d8Worktree() {
  const worktreePath = path.join(root, ".qa-worktree-aca52d8");
  try {
    if (!fs.existsSync(path.join(worktreePath, "index.html"))) {
      execSync(`git worktree add "${worktreePath}" aca52d8 --detach`, {
        cwd: root,
        stdio: "pipe"
      });
    }
    return worktreePath;
  } catch (err) {
    console.warn("Could not create aca52d8 worktree:", err.message);
    return null;
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = {
  generatedAt: new Date().toISOString(),
  localCommit: execSync("git rev-parse HEAD", { cwd: root }).toString().trim(),
  measurements: {},
  interior: {},
  notes: []
};

await capture(page, prodUrl + "/", "A-production-095cd5e-1366x768.png", LAPTOP);
await page.setViewportSize(LAPTOP);
await page.goto(prodUrl + "/", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(800);
report.measurements["production-095cd5e"] = await measureHomepage(page);

const acaPath = setupAca52d8Worktree();
if (acaPath && fs.existsSync(path.join(acaPath, "index.html"))) {
  const acaFile = path.join(acaPath, "index.html").replace(/\\/g, "/");
  await capture(page, `file:///${acaFile}`, "B-aca52d8-reference-1366x768.png", LAPTOP);
  report.notes.push("aca52d8 rendered from git worktree");
} else {
  report.notes.push("aca52d8 worktree not available");
}

await capture(page, localUrl + "/index.html", "baseline-local-no-variant-1366x768.png", LAPTOP);
await page.setViewportSize(LAPTOP);
await page.goto(localUrl + "/index.html", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(800);
report.measurements["local-baseline"] = await measureHomepage(page);

await capture(
  page,
  localUrl + "/index.html",
  "C-variant-a-cinematic-1366x768.png",
  LAPTOP,
  ["body--hero-v-a", "body--photobreak-a"]
);
await page.setViewportSize(LAPTOP);
await page.goto(localUrl + "/index.html", { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => {
  document.body.classList.add("body--hero-v-a", "body--photobreak-a");
});
await page.waitForTimeout(800);
report.measurements["variant-a"] = await measureHomepage(page);

await capture(
  page,
  localUrl + "/index.html",
  "D-variant-b-portrait-1366x768.png",
  LAPTOP,
  ["body--hero-v-b", "body--photobreak-b"]
);
await page.setViewportSize(LAPTOP);
await page.goto(localUrl + "/index.html", { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => {
  document.body.classList.add("body--hero-v-b", "body--photobreak-b");
});
await page.waitForTimeout(800);
report.measurements["variant-b"] = await measureHomepage(page);

await capture(
  page,
  localUrl + "/index.html",
  "photobreak-A-single-1366x768.png",
  LAPTOP,
  ["body--hero-v-a", "body--photobreak-a"]
);
await page.evaluate(() => {
  const el = document.querySelector(".home-photo-break, .home-photo-strip");
  if (el) el.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, "photobreak-A-single-crop-1366x768.png") });

await capture(
  page,
  localUrl + "/index.html",
  "photobreak-B-strip-1366x768.png",
  LAPTOP,
  ["body--hero-v-a", "body--photobreak-b"]
);
await page.evaluate(() => {
  const el = document.querySelector(".home-photo-strip");
  if (el) el.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, "photobreak-B-strip-crop-1366x768.png") });

report.mobile = {};
for (const vp of viewports) {
  await capture(
    page,
    localUrl + "/index.html",
    `variant-a-${vp.name}.png`,
    { width: vp.width, height: vp.height },
    ["body--hero-v-a", "body--photobreak-a"]
  );
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(localUrl + "/index.html", { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => {
    document.body.classList.add("body--hero-v-a", "body--photobreak-a");
  });
  await page.waitForTimeout(500);
  report.mobile[vp.name] = await measureHomepage(page);
}

for (const vp of [
  { name: "1366x768", width: 1366, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "390x844", width: 390, height: 844 }
]) {
  await capture(
    page,
    localUrl + "/index.html",
    `variant-b-${vp.name}.png`,
    { width: vp.width, height: vp.height },
    ["body--hero-v-b", "body--photobreak-b"]
  );
}

await captureFull(page, prodUrl + "/", "production-full-1366x768.png", LAPTOP);
await captureFull(
  page,
  localUrl + "/index.html",
  "variant-a-full-1366x768.png",
  LAPTOP,
  ["body--hero-v-a", "body--photobreak-a"]
);
await captureFull(
  page,
  localUrl + "/index.html",
  "variant-b-full-1366x768.png",
  LAPTOP,
  ["body--hero-v-b", "body--photobreak-b"]
);

for (const name of interiorPages) {
  await page.setViewportSize(LAPTOP);
  await page.goto(`${localUrl}/${name}.html`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(700);
  report.interior[name] = await measureInterior(page);
  await page.screenshot({
    path: path.join(outDir, `interior-${name}-1366x768.png`),
    fullPage: true
  });
  console.log("Interior audit:", name);
}

report.contentLock = {
  contentJsonModified: execSync("git status --porcelain assets/content.json", { cwd: root })
    .toString()
    .trim() === ""
};

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
report.seoLock = {
  titlePresent: indexHtml.includes("Håvard Pedersen — Norwegian guitarist"),
  canonicalPresent: indexHtml.includes('rel="canonical" href="https://www.havardpedersen.com/"'),
  ogHomePresent: indexHtml.includes("og-home.jpg"),
  jsonLdPresent: indexHtml.includes('"@type": "MusicGroup"')
};

fs.writeFileSync(path.join(outDir, "phase9-report.json"), JSON.stringify(report, null, 2));
console.log("\nPhase 9 QA complete:", outDir);
console.log(JSON.stringify(report.measurements, null, 2));

await browser.close();
