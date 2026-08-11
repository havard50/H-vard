import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3333";
const pages = [
  "live",
  "music",
  "video",
  "bio",
  "news",
  "press",
  "epk",
  "contact",
  "shop"
];
const widths = [1440, 1280, 1024, 768, 430, 390, 375];

function measure(page) {
  return page.evaluate(() => {
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const hero = document.querySelector(".site-page__hero, .page-epk .site-page__hero");
    const h1 = document.querySelector("h1");
    const heroImg = document.querySelector(
      ".site-page__hero-figure img, .video-featured video, .video-featured .yt-lazy, .shop-simple__art img, .epk-live-video video"
    );
    const mainImg = document.querySelector(
      ".music-release--latest img, .bio-block img, .news-editorial__figure img, .gallery-tile img"
    );
    const bodyCopy = document.querySelector(".bio-block p, .epk-main p, .site-page__lead");
    const firstSection = document.querySelector(".site-section");
    const header = document.querySelector(".site-header--global");

    const gaps = [];
    const sections = [...document.querySelectorAll(".site-section, .bio-block, .music-release")];
    for (let i = 0; i < sections.length - 1; i++) {
      const a = sections[i].getBoundingClientRect();
      const b = sections[i + 1].getBoundingClientRect();
      gaps.push(Math.round(b.top - a.bottom));
    }

    return {
      h1: h1
        ? {
            fontSize: cs(h1).fontSize,
            height: Math.round(rect(h1).height),
            text: h1.textContent.trim().slice(0, 40)
          }
        : null,
      hero: hero
        ? {
            height: Math.round(rect(hero).height),
            paddingTop: cs(hero).paddingTop,
            paddingBottom: cs(hero).paddingBottom
          }
        : null,
      heroToContent:
        hero && firstSection
          ? Math.round(firstSection.getBoundingClientRect().top - hero.getBoundingClientRect().bottom)
          : null,
      heroImage: heroImg
        ? {
            w: Math.round(rect(heroImg).width),
            h: Math.round(rect(heroImg).height),
            sel: heroImg.tagName + (heroImg.className ? "." + String(heroImg.className).split(" ")[0] : "")
          }
        : null,
      contentImage: mainImg
        ? {
            w: Math.round(rect(mainImg).width),
            h: Math.round(rect(mainImg).height)
          }
        : null,
      bodyMaxWidth: bodyCopy ? cs(bodyCopy).maxWidth : null,
      bodyFontSize: bodyCopy ? cs(bodyCopy).fontSize : null,
      headerHeight: header ? Math.round(rect(header).height) : null,
      largestGap: gaps.length ? Math.max(...gaps) : 0,
      scrollHeight: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = {};

for (const name of pages) {
  report[name] = {};
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${baseUrl.replace(/\/$/, "")}/${name}.html`, {
      waitUntil: "networkidle",
      timeout: 60000
    });
    await page.waitForTimeout(800);
    report[name][w] = await measure(page);
  }
}

const outDir = path.resolve(__dirname, "..", ".qa-screenshots");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "visual-scale-audit.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
