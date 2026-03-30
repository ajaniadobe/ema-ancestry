/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-links variant.
 * Base block: columns. Source: https://www.ancestry.com/
 *
 * Columns library structure:
 *   1 row with N cells, each cell is a column of content.
 *
 * Source DOM (.ancestry-footer):
 *   Contains 3 .linklist elements, each inside a .cmp-container__container-content
 *   wrapper that also contains a sibling h2 heading.
 *   Column 1: "Genealogy Resources" (5 links)
 *   Column 2: "Historical Collections" (4 links)
 *   Column 3: "Family Trees" (3 links)
 *
 * NOTE: Validator cannot validate this parser because ancestry.com serves a bot
 * challenge page to fresh headless browsers. All selectors verified on live page
 * via active Playwright session.
 */
export default function parse(element, { document }) {
  const linklists = element.querySelectorAll('.linklist');
  if (linklists.length === 0) return;

  const columnCells = [];

  linklists.forEach((ll) => {
    const container = ll.closest('.cmp-container__container-content') || ll.parentElement;
    const h2 = container.querySelector('h2');
    const linkList = ll.querySelector('ul') || ll.querySelector('.ancestry-cmp-link-list');

    const cellContent = [];
    if (h2) cellContent.push(h2);
    if (linkList) cellContent.push(linkList);

    if (cellContent.length > 0) {
      columnCells.push(cellContent);
    }
  });

  if (columnCells.length === 0) return;

  const cells = [columnCells];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-links', cells });
  element.replaceWith(block);
}
