/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-gradient variant.
 * Base block: hero. Source: https://www.ancestry.com/
 *
 * Hero library structure:
 *   Row 1: Background image (optional - skipped for this CSS gradient variant)
 *   Row 2: Heading + description + CTA + fine print
 *
 * Source DOM (.showBAUHero .a250-gradient):
 *   Contains hero content group with h1, description p, CTA link, fine print p,
 *   and a sibling promo overlay group. Parser scopes to h1's parent container
 *   to exclude the promo overlay.
 *
 * NOTE: Validator cannot validate this parser because ancestry.com serves a bot
 * challenge page to fresh headless browsers. All selectors verified on live page
 * via active Playwright session.
 */
export default function parse(element, { document }) {
  const h1 = element.querySelector('h1');
  if (!h1) return;

  // Scope to h1's parent to exclude sibling promo overlay
  const heroContent = h1.parentElement;
  const contentCell = [h1];

  // Collect paragraphs (exclude link-internal text)
  const paragraphs = Array.from(heroContent.querySelectorAll('p'))
    .filter((p) => !p.closest('a') && p.textContent.trim().length > 0);

  // First paragraph is the description
  if (paragraphs[0]) contentCell.push(paragraphs[0]);

  // CTA link
  const cta = heroContent.querySelector('a[href]');
  if (cta) contentCell.push(cta);

  // Remaining paragraphs (fine print, etc.)
  for (let i = 1; i < paragraphs.length; i++) {
    contentCell.push(paragraphs[i]);
  }

  const cells = [contentCell];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-gradient', cells });
  element.replaceWith(block);
}
