/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video testimonial section on product-landing page.
 * Source: https://www.ancestry.com/c/ancestry-family
 *
 * Creates a youtube block from the YouTube link, and preserves
 * quote text as sibling default content.
 *
 * Source DOM (.container-media-2bd99ee711 .itemlist):
 *   cmp-item-list with 2 items in flex layout:
 *   - Item 0: YouTube link (converted from iframe by cleanup transformer)
 *   - Item 1: Quote heading (h2) + description paragraphs
 *   The cleanup transformer converts YouTube iframes to <a> links
 *   before parsers run. Parser finds the link and creates a youtube block.
 */
export default function parse(element, { document }) {
  // Find YouTube link (converted from iframe by cleanup transformer step 0b)
  const ytLink = element.querySelector('a[href*="youtube.com/watch"]');
  if (!ytLink) return;

  const videoItem = ytLink.closest('.cmp-item-list__item');

  // Create a fresh link element for the block cell
  const link = document.createElement('a');
  link.href = ytLink.href;
  link.textContent = ytLink.href;

  // Create youtube block
  const cells = [[link]];
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'youtube',
    cells,
  });

  // Replace the video item with the youtube block, preserving the quote item
  if (videoItem) {
    videoItem.replaceWith(block);
  } else {
    // Fallback: replace the whole element
    element.replaceWith(block);
  }
}
