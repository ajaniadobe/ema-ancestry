/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-gradient variant.
 * Base block: hero. Source: https://www.ancestry.com/
 *
 * Hero library structure:
 *   Row 1: Heading + description + CTA + fine print (single cell)
 *   Row 2: Authorable image (extracted from CSS background-image)
 *
 * Source DOM (.showBAUHero .a250-gradient):
 *   Contains a container-media div with CSS background-image set via <style> block.
 *   Hero content (h1, description, CTA, fine print) is spread across separate AEM
 *   grid cells within .cmp-container__container-content. Parser collects all content
 *   elements into a single wrapper to produce a clean single-cell text row.
 *   Responsive-only variants (show480, show768) are filtered out.
 *
 * NOTE: Validator cannot validate this parser because ancestry.com serves a bot
 * challenge page to fresh headless browsers. All selectors verified on live page
 * via active Playwright session.
 */
export default function parse(element, { document }) {
  const h1 = element.querySelector('h1');
  if (!h1) return;

  // Extract background image from container-media element's computed style
  let bgImageUrl = null;
  const bgContainer = element.querySelector('[class*="container-media-"]');
  if (bgContainer) {
    try {
      const computedStyle = window.getComputedStyle(bgContainer);
      const bgImage = computedStyle.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (match) bgImageUrl = match[1];
      }
    } catch (e) {
      // Fallback below
    }
  }

  // Fallback: extract background-image URL from inline <style> blocks
  if (!bgImageUrl) {
    const styleEls = element.querySelectorAll('style');
    for (const styleEl of styleEls) {
      const text = styleEl.textContent;
      const matches = [...text.matchAll(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/g)];
      if (matches.length > 0) {
        bgImageUrl = matches[matches.length - 1][1];
        break;
      }
    }
  }

  // Use the broader container-media content area to find all hero elements
  const contentScope = bgContainer
    ? (bgContainer.querySelector('.cmp-container__container-content') || bgContainer)
    : element;

  // Build a single content wrapper with all text elements
  const contentWrapper = document.createElement('div');

  // Add heading
  contentWrapper.appendChild(h1.cloneNode(true));

  // Collect paragraphs from .cmp-text elements, filtering out mobile-only variants
  const paragraphs = Array.from(contentScope.querySelectorAll('.cmp-text p'))
    .filter((p) => !p.closest('a')
      && p.textContent.trim().length > 0
      && !p.classList.contains('show480')
      && !p.classList.contains('show768'));

  // Add description paragraph
  if (paragraphs[0]) {
    const p = document.createElement('p');
    p.textContent = paragraphs[0].textContent.trim();
    contentWrapper.appendChild(p);
  }

  // Add CTA link wrapped in <p>
  const cta = contentScope.querySelector('.cmp-button__wrapper a[href]');
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = cta.href;
    a.textContent = cta.textContent.trim();
    p.appendChild(a);
    contentWrapper.appendChild(p);
  }

  // Add fine print paragraphs
  for (let i = 1; i < paragraphs.length; i++) {
    const p = document.createElement('p');
    p.textContent = paragraphs[i].textContent.trim();
    contentWrapper.appendChild(p);
  }

  // Build cells: Row 1 = text content, Row 2 = authorable image (if found)
  const cells = [];
  cells.push([contentWrapper]);
  if (bgImageUrl) {
    if (bgImageUrl.startsWith('//')) bgImageUrl = 'https:' + bgImageUrl;
    const img = document.createElement('img');
    img.src = bgImageUrl;
    img.alt = '';
    cells.push([img]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-gradient', cells });
  element.replaceWith(block);
}
