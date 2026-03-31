/* eslint-disable */
/* global WebImporter */
/**
 * Parser for banner-promo variant.
 * Base block: banner-promo. Source: https://www.ancestry.com/
 *
 * Banner promo library structure:
 *   Row 1: image (col 1) | text (col 2) | CTA link (col 3)
 *
 * Source DOM (.container-media-9922a722ac):
 *   Dark promotional banner below the hero. Contains centered text and a CTA button.
 *   May also pick up a nearby decorative image (ribbon/badge) from an adjacent
 *   container in the hero area.
 *
 * NOTE: Validator cannot validate this parser because ancestry.com serves a bot
 * challenge page to fresh headless browsers. All selectors verified on live page
 * via active Playwright session.
 */
export default function parse(element, { document }) {
  const seen = new Set();

  // Collect text paragraphs (deduplicated)
  const paragraphs = Array.from(element.querySelectorAll('.cmp-text p'))
    .filter((p) => {
      if (p.closest('a')) return false;
      const text = p.textContent.trim();
      if (text.length === 0 || seen.has(text)) return false;
      seen.add(text);
      return true;
    });

  // Collect CTA link
  const cta = element.querySelector('.cmp-button__wrapper a[href]')
    || element.querySelector('a[href]');

  if (paragraphs.length === 0 && !cta) return;

  // Column 1: Decorative image (from sibling container)
  const imageCell = document.createElement('div');
  const parentList = element.closest('.cmp-item-list__items, .cmp-container__container-content');
  if (parentList) {
    const items = parentList.querySelectorAll(':scope > .cmp-item-list__item, :scope > .cmp-item-list__item-wrapper');
    for (const item of items) {
      if (item.contains(element)) continue;
      const img = item.querySelector('img[src]:not([src^="data:"])');
      if (img && img.naturalWidth > 0) {
        const p = document.createElement('p');
        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.alt = img.alt || '';
        p.appendChild(imgEl);
        imageCell.appendChild(p);
        break;
      }
    }
  }

  // Column 2: Text paragraphs
  const textCell = document.createElement('div');
  paragraphs.forEach((para) => {
    const p = document.createElement('p');
    p.innerHTML = para.innerHTML;
    textCell.appendChild(p);
  });

  // Column 3: CTA link
  const ctaCell = document.createElement('div');
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = cta.href;
    a.textContent = cta.textContent.trim();
    p.appendChild(a);
    ctaCell.appendChild(p);
  }

  const cells = [[imageCell, textCell, ctaCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'banner-promo', cells });
  element.replaceWith(block);
}
