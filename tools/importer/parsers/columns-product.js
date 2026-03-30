/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-product variant.
 * Base block: columns. Source: https://www.ancestry.com/
 *
 * Columns library structure:
 *   1 row with N cells, each cell is a column of content.
 *
 * Source DOM (.container-media-08aa36823a = column 1):
 *   Two sibling column containers within a shared parent.
 *   Column 1: .container-media-08aa36823a (Family History)
 *   Column 2: .container-media-441f9d91fa (AncestryDNA)
 *   Each column contains: title paragraph, description paragraph, CTA link.
 *   Parser receives column 1, finds sibling column 2, builds 2-cell row.
 *
 * NOTE: Validator cannot validate this parser because ancestry.com serves a bot
 * challenge page to fresh headless browsers. All selectors verified on live page
 * via active Playwright session.
 */
export default function parse(element, { document }) {
  const sibling = element.parentElement?.querySelector('.container-media-441f9d91fa');

  function extractContent(col) {
    const content = [];
    const seen = new Set();
    const paragraphs = Array.from(col.querySelectorAll('p'))
      .filter((p) => !p.closest('a') && !p.closest('.cmp-button__text') && p.textContent.trim().length > 0);
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (!seen.has(text)) {
        seen.add(text);
        content.push(p);
      }
    });
    const cta = col.querySelector('a[href]');
    if (cta) content.push(cta);
    return content;
  }

  const col1Content = extractContent(element);
  const col2Content = sibling ? extractContent(sibling) : [];

  const cells = [
    [col1Content, col2Content],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-product', cells });
  element.replaceWith(block);

  if (sibling) sibling.remove();
}
