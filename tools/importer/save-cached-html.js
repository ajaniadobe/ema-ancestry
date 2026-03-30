#!/usr/bin/env node
/**
 * Saves full page HTML from Ancestry URLs using Playwright.
 * Uses stealth settings to bypass bot detection.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { chromium } from 'playwright';

const PAGES = [
  { url: 'https://www.ancestry.com/', filename: 'homepage.html' },
  { url: 'https://www.ancestry.com/c/ancestry-family', filename: 'ancestry-family.html' },
  { url: 'https://www.ancestry.com/c/discover', filename: 'discover.html' },
  { url: 'https://www.ancestry.com/c/dna-learning-hub', filename: 'dna-learning-hub.html' },
];

const OUTPUT_DIR = 'tools/importer/cached-html';

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage', '--disable-gpu',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });

  for (const { url, filename } of PAGES) {
    console.log(`Navigating to ${url}...`);
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Scroll the full page to trigger lazy-loaded images.
      // Ancestry uses JS-based lazy loading that only resolves image src
      // when elements enter the viewport. Without scrolling, images remain
      // as data:image/gif placeholders with no data-src/srcset fallback.
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = 1080;
      for (let y = 0; y < scrollHeight; y += viewportHeight) {
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(500);
      }
      // Scroll back to top and wait for final image loads
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(2000);

      const html = await page.content();
      const outPath = join(OUTPUT_DIR, filename);
      writeFileSync(outPath, html, 'utf-8');
      console.log(`✅ Saved ${filename} (${(html.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`❌ Failed ${url}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
  console.log('Done.');
}

main().catch(console.error);
