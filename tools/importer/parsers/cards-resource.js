/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-resource block.
 * Source: https://www.ancestry.com/c/dna-learning-hub
 *
 * Cards-resource library structure:
 *   2 columns per row: image cell | text content cell.
 *   Multiple rows for multiple cards in a single block.
 *
 * Source DOM (.itemlist.equalHeightCons or .itemlist within #learningHubResources):
 *   Each .cmp-item-list__item contains:
 *     - A .bkgsizeCover container with background-image set via <style> tag
 *     - Text content with h3 heading (linked), description paragraphs, and CTA links
 *   Parser extracts background-image URLs from preceding <style> tags and
 *   creates <img> elements. Combines sibling .itemlist.equalHeightCons rows
 *   into a single block.
 */
export default function parse(element, { document }) {
  // Skip if already removed from DOM by a previous sibling parse
  if (!element.parentNode) return;

  // Collect card items from this element
  const items = [...element.querySelectorAll('.cmp-item-list__item')];

  // Combine sibling .itemlist.equalHeightCons rows into one block
  let next = element.nextElementSibling;
  while (next) {
    if (next.classList.contains('itemlist') && next.classList.contains('equalHeightCons')) {
      items.push(...next.querySelectorAll('.cmp-item-list__item'));
      const toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    } else {
      break;
    }
  }

  if (items.length === 0) return;

  const rows = [];

  items.forEach((item) => {
    // 1. Extract image from CSS background-image in <style> tag
    let img = null;
    const bgContainer = item.querySelector('.bkgsizeCover');
    if (bgContainer) {
      const styleTag = bgContainer.querySelector('style');
      if (styleTag) {
        const match = styleTag.textContent.match(
          /background-image\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/
        );
        if (match) {
          let url = match[1];
          if (url.startsWith('//')) url = `https:${url}`;
          img = document.createElement('img');
          img.src = url;
        }
      }
    }
    // Fallback to regular <img> tag
    if (!img) {
      img = item.querySelector('.cmp-image__image') || item.querySelector('img');
    }

    // 2. Extract text content: heading, description, CTA
    const bodyContent = [];
    const heading = item.querySelector('h3, h2');
    if (heading) bodyContent.push(heading);

    // Collect description and CTA paragraphs from all .cmp-text blocks
    const cmpTexts = item.querySelectorAll('.cmp-text');
    cmpTexts.forEach((ct) => {
      ct.querySelectorAll('p').forEach((p) => {
        // Skip paragraphs that are inside headings (already captured)
        if (p.closest('h3') || p.closest('h2')) return;
        if (p.textContent.trim()) bodyContent.push(p);
      });
    });

    if (img || bodyContent.length > 0) {
      rows.push([img || '', bodyContent.length > 0 ? bodyContent : '']);
    }
  });

  if (rows.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-resource',
    cells: rows,
  });
  element.replaceWith(block);
}
