/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-pricing variant.
 * Base block: cards (no images). Source: https://www.ancestry.com/
 *
 * Cards (no images) library structure:
 *   1 column per row, each row is a card with text content.
 *
 * Source DOM (.container-media-a9324d642c .cmp-item-list__items):
 *   Contains 3 child .cmp-item-list__item-wrapper elements, each wrapping
 *   a pricing card with: product name, "From" + price, features list (ul), CTA link.
 *   Cards: Family History ($24.99/mo), DNA ($99.00), Family History + DNA ($100.00)
 *
 * NOTE: Validator cannot validate this parser because ancestry.com serves a bot
 * challenge page to fresh headless browsers. All selectors verified on live page
 * via active Playwright session.
 */
export default function parse(element, { document }) {
  const cardWrappers = element.querySelectorAll(':scope > .cmp-item-list__item-wrapper');
  const cells = [];

  cardWrappers.forEach((wrapper) => {
    const card = wrapper.querySelector('[class*="container-media-"]');
    if (!card) return;

    const cardContent = [];
    const seen = new Set();

    card.querySelectorAll('p, ul').forEach((el) => {
      if (el.tagName === 'P' && el.closest('a')) return;
      const text = el.textContent.trim();
      if (text.length === 0 || seen.has(text)) return;
      seen.add(text);
      cardContent.push(el);
    });

    const cta = card.querySelector('a[href]');
    if (cta) {
      const ctaText = cta.textContent.trim();
      if (!seen.has(ctaText)) {
        seen.add(ctaText);
      }
      cardContent.push(cta);
    }

    const allParagraphs = Array.from(card.querySelectorAll('p'))
      .filter((p) => !p.closest('a') && p.textContent.trim().startsWith('*'));
    allParagraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (!seen.has(text)) {
        seen.add(text);
        cardContent.push(p);
      }
    });

    if (cardContent.length > 0) {
      cells.push([cardContent]);
    }
  });

  if (cells.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-pricing', cells });
  element.replaceWith(block);
}
