/* eslint-disable */
/* global WebImporter */
/**
 * Parser for card-promo variant.
 * Base block: cards. Source: https://www.ancestry.com/
 *
 * Cards library structure (with images):
 *   2 columns per row: image cell | text content cell.
 *   Each instance is a single promotional card.
 *
 * Source DOM (.container-media-788b206008 or .container-media-4948219488):
 *   Each contains: img (promo image), h3 heading, description paragraphs, CTA link.
 *   Instance 1: AncestryPreserve promo in section-3
 *   Instance 2: Finding Your Roots promo in section-5
 *
 * NOTE: Validator cannot validate this parser because ancestry.com serves a bot
 * challenge page to fresh headless browsers. All selectors verified on live page
 * via active Playwright session.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('img');
  const heading = element.querySelector('h3, h2');

  const seen = new Set();
  const paragraphs = Array.from(element.querySelectorAll('p'))
    .filter((p) => {
      if (p.closest('a') || p.closest('.cmp-button__text')) return false;
      const text = p.textContent.trim();
      if (text.length === 0 || seen.has(text)) return false;
      seen.add(text);
      return true;
    });

  const cta = element.querySelector('a[href]');

  const imageCell = img || '';
  const textCell = [];
  if (heading) textCell.push(heading);
  paragraphs.forEach((p) => textCell.push(p));
  if (cta) textCell.push(cta);

  const cells = [
    [imageCell, textCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'card-promo', cells });
  element.replaceWith(block);
}
