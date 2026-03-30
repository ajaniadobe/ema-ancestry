#!/usr/bin/env node

/**
 * Cached Import Runner
 *
 * Modified version of run-bulk-import.js that serves pre-cached HTML
 * via Playwright route interception. This bypasses bot challenges by
 * serving locally-saved page HTML while still allowing external assets
 * (CSS, JS, images) to load from the live site.
 *
 * Usage:
 *   node tools/importer/run-cached-import.js \
 *     --import-script path/to/import.bundle.js \
 *     --urls path/to/urls.txt \
 *     --cached-html-dir tools/importer/cached-html
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find the plugin scripts dir for helix-importer and report compiler
const PLUGIN_SCRIPTS_DIR = '/home/node/.claude/plugins/cache/excat-marketplace/excat/2.1.1/skills/excat-content-import/scripts';
const { compileReportsToExcel } = await import(join(PLUGIN_SCRIPTS_DIR, 'import-report.js'));

const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const PAGE_TIMEOUT = 45000;

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      parsed[args[i]] = args[i + 1];
      i++;
    }
  }
  if (!parsed['--import-script'] || !parsed['--urls']) {
    console.error('Usage: node run-cached-import.js --import-script <bundle.js> --urls <urls.txt> --cached-html-dir <dir>');
    process.exit(1);
  }
  return {
    importScript: resolve(parsed['--import-script']),
    urlsFile: resolve(parsed['--urls']),
    cachedHtmlDir: resolve(parsed['--cached-html-dir'] || 'tools/importer/cached-html'),
    outputDir: resolve(process.cwd(), 'content'),
  };
}

function loadUrls(urlFile) {
  return readFileSync(urlFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

function loadUrlMap(cachedHtmlDir) {
  const mapPath = join(cachedHtmlDir, 'url-map.json');
  if (!existsSync(mapPath)) return {};
  return JSON.parse(readFileSync(mapPath, 'utf-8'));
}

function ensureDir(pathname) {
  mkdirSync(pathname, { recursive: true });
}

function sanitizeDocumentPath(docPath, fallbackUrl) {
  if (!docPath || typeof docPath !== 'string') {
    const { pathname } = new URL(fallbackUrl);
    docPath = pathname || '/';
  }
  let normalized = docPath.replace(/\\/g, '/');
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized === '') normalized = 'index';
  return normalized;
}

async function processUrl({ context, url, helixImporterScript, importScriptContent, outputDir, cachedHtmlDir, urlMap, index, total }) {
  const label = `[${index}/${total}]`;
  console.log(`${label} Starting ${url}`);

  const page = await context.newPage();

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') console.error(`[Browser Console] ${text}`);
    else if (type === 'warning') console.warn(`[Browser Console] ${text}`);
    else console.log(`[Browser Console] ${text}`);
  });

  // Stealth init script
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  try {
    // Check if we have cached HTML for this URL
    const cachedFile = urlMap[url];
    const cachedPath = cachedFile ? join(cachedHtmlDir, cachedFile) : null;
    const hasCachedHtml = cachedPath && existsSync(cachedPath);

    if (hasCachedHtml) {
      const cachedHtml = readFileSync(cachedPath, 'utf-8');
      console.log(`${label} 📦 Using cached HTML (${(cachedHtml.length / 1024).toFixed(0)}KB)`);

      // Route interception: serve cached HTML for the main document request,
      // let all other requests (CSS, JS, images, fonts) pass through to live site
      await page.route('**/*', async (route) => {
        const request = route.request();
        const requestUrl = request.url();
        const resourceType = request.resourceType();

        // Only intercept the main document navigation request
        if (resourceType === 'document' && (requestUrl === url || requestUrl === url + '/')) {
          await route.fulfill({
            status: 200,
            contentType: 'text/html; charset=utf-8',
            body: cachedHtml,
          });
        } else {
          await route.continue();
        }
      });
    }

    // Navigate to the URL (will be intercepted if cached)
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
      await page.waitForTimeout(2000); // Let the DOM settle
    } catch (error) {
      console.log(`${label} ⚠️  Navigation timeout, proceeding anyway...`);
    }

    // Inject Helix importer bundle
    await page.evaluate(script => {
      const originalDefine = window.define;
      if (typeof window.define !== 'undefined') delete window.define;
      const scriptEl = document.createElement('script');
      scriptEl.textContent = script;
      document.head.appendChild(scriptEl);
      if (originalDefine) window.define = originalDefine;
    }, helixImporterScript);

    // Inject the import script
    await page.evaluate(script => {
      const scriptEl = document.createElement('script');
      scriptEl.textContent = script;
      document.head.appendChild(scriptEl);
    }, importScriptContent);

    // Wait for CustomImportScript
    try {
      await page.waitForFunction(
        () => typeof window.CustomImportScript !== 'undefined' && window.CustomImportScript?.default,
        { timeout: 10000 }
      );
    } catch {
      throw new Error('CustomImportScript.default not found after 10s.');
    }

    // Run the import transform
    const result = await page.evaluate(async pageUrl => {
      if (!window.WebImporter || typeof window.WebImporter.html2md !== 'function') {
        throw new Error('WebImporter not available.');
      }
      const customImportConfig = window.CustomImportScript?.default;
      if (!customImportConfig) {
        throw new Error('CustomImportScript not available.');
      }

      const result = await window.WebImporter.html2md(pageUrl, document, customImportConfig, {
        toDocx: false,
        toMd: true,
        originalURL: pageUrl,
      });

      result.html = window.WebImporter.md2da(result.md);
      return result;
    }, url);

    if (!result.path || typeof result.path !== 'string') {
      throw new Error(`Transform did not return valid path.`);
    }
    if (!result.html || typeof result.html !== 'string') {
      throw new Error(`HTML generation failed.`);
    }

    const relativeDocPath = sanitizeDocumentPath(result.path, url);
    const plainHtmlPath = join(outputDir, `${relativeDocPath}.plain.html`);
    ensureDir(dirname(plainHtmlPath));
    writeFileSync(plainHtmlPath, result.html, 'utf-8');

    // Write report
    const reportsDir = 'tools/importer/reports';
    const reportPath = join(reportsDir, `${relativeDocPath}.report.json`);
    ensureDir(dirname(reportPath));
    writeFileSync(reportPath, JSON.stringify({
      status: 'success',
      url,
      path: relativeDocPath,
      timestamp: new Date().toISOString(),
      cachedHtml: hasCachedHtml,
      ...(result.report || {}),
    }, null, 2), 'utf-8');

    console.log(`${label} ✅ Saved content to ${relativeDocPath}`);
    return { success: true, path: relativeDocPath };
  } catch (error) {
    console.error(`${label} ❌ Failed for ${url}: ${error.message}`);
    try {
      const { pathname } = new URL(url);
      let fallbackPath = pathname || '/';
      if (fallbackPath.endsWith('/')) fallbackPath = fallbackPath === '/' ? '/index' : fallbackPath.slice(0, -1);
      if (fallbackPath.startsWith('/')) fallbackPath = fallbackPath.slice(1);
      if (fallbackPath === '') fallbackPath = 'index';
      const reportsDir = 'tools/importer/reports';
      const reportPath = join(reportsDir, `${fallbackPath}.report.json`);
      ensureDir(dirname(reportPath));
      writeFileSync(reportPath, JSON.stringify({
        status: 'failed', url, path: fallbackPath,
        timestamp: new Date().toISOString(),
        error: error.message,
      }, null, 2), 'utf-8');
    } catch {}
    return { success: false, error };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const { importScript, urlsFile, cachedHtmlDir, outputDir } = parseArgs();
  const urls = loadUrls(urlsFile);
  const urlMap = loadUrlMap(cachedHtmlDir);
  ensureDir(outputDir);

  const helixImporterPath = join(PLUGIN_SCRIPTS_DIR, 'static', 'inject', 'helix-importer.js');
  const helixImporterScript = readFileSync(helixImporterPath, 'utf-8');
  const importScriptContent = readFileSync(importScript, 'utf-8');

  const cachedCount = urls.filter(u => urlMap[u]).length;
  console.log('[Cached Import] Starting run with:');
  console.log(`  Import script: ${importScript}`);
  console.log(`  URLs file:     ${urlsFile}`);
  console.log(`  Cached HTML:   ${cachedHtmlDir}`);
  console.log(`  Output dir:    ${outputDir}`);
  console.log(`  URL count:     ${urls.length} (${cachedCount} cached)`);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage', '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });

  let successCount = 0;
  try {
    for (let i = 0; i < urls.length; i++) {
      const result = await processUrl({
        context, url: urls[i], helixImporterScript, importScriptContent,
        outputDir, cachedHtmlDir, urlMap, index: i + 1, total: urls.length,
      });
      if (result.success) successCount++;
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  console.log(`[Cached Import] Completed. Success: ${successCount}/${urls.length}, Failures: ${urls.length - successCount}`);
  await compileReportsToExcel(importScript);
}

main().catch(err => {
  console.error('[Cached Import] Unexpected error:', err);
  process.exit(1);
});
