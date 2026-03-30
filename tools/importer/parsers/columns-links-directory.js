/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-links block (directory variant).
 * Source: https://www.ancestry.com/c/dna-learning-hub
 *
 * Columns-links library structure:
 *   1 row with N cells, each cell is a column of content (headings + link lists).
 *
 * Source DOM (#learningHubLinkLists .itemlist):
 *   Contains 3 column items (.cmp-item-list__item), separated by vertical-separator spans.
 *   Each column has one or more .cmp-text blocks containing h3 category headings
 *   followed by ul link lists (e.g., "Genetic Testing" with 7 links).
 *   Total: 6 categories, 56+ links across 3 columns.
 *
 * Differs from columns-links.js (homepage variant) which targets .linklist elements.
 * This parser targets .cmp-item-list__item elements with h3 + ul pairs.
 */
export default function parse(element, { document }) {
  const items = element.querySelectorAll('.cmp-item-list__item');
  if (items.length === 0) return;

  const columnCells = [];

  items.forEach((item) => {
    const cellContent = [];

    // Collect all h3 headings and ul link lists in order
    item.querySelectorAll('.cmp-text').forEach((ct) => {
      ct.querySelectorAll('h3, ul').forEach((el) => {
        cellContent.push(el);
      });
    });

    if (cellContent.length > 0) {
      columnCells.push(cellContent);
    }
  });

  if (columnCells.length === 0) return;

  // Single row with N column cells
  const cells = [columnCells];
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-links',
    cells,
  });
  element.replaceWith(block);
}
