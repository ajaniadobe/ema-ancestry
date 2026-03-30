/* eslint-disable */
/* global WebImporter */
/**
 * Parser for Getting Started steps on the product-landing page.
 * Source: https://www.ancestry.com/c/ancestry-family
 *
 * Outputs a cards-resource block with 4 step rows (GIF image | step text).
 *
 * Source DOM (.container-media-151fc3002f section.hide768):
 *   Desktop tab UI with two parts:
 *   - #container-level-content: 4 .tabContent panels, each containing a GIF <img>
 *   - #container-level-tabs .tabsCon: 4 <button class="tab"> elements with
 *     <b>Step title.</b><br> Step description.
 *   Parser correlates tab panels and buttons by index.
 *   Mobile carousel variant (show768) is removed by cleanup transformer.
 */
export default function parse(element, { document }) {
  // Find tab content panels (contain GIF images)
  const tabPanels = element.querySelectorAll('.tabContent');
  // Find tab buttons (contain step text)
  const tabButtons = element.querySelectorAll('.tab, [role="tab"]');

  if (tabPanels.length === 0 && tabButtons.length === 0) return;

  const rows = [];
  const count = Math.max(tabPanels.length, tabButtons.length);

  for (let i = 0; i < count; i++) {
    // Extract image from tab panel
    const panel = tabPanels[i];
    const img = panel ? panel.querySelector('img') : null;

    // Extract text from tab button
    const btn = tabButtons[i];
    const bodyContent = [];

    if (btn) {
      const strong = btn.querySelector('strong, b, .bold');
      if (strong) {
        const h3 = document.createElement('h3');
        h3.textContent = strong.textContent.trim();
        bodyContent.push(h3);
      }

      // Get description from full button text minus the bold heading.
      // Buttons use <b>Title.</b><br> Description with <br> line breaks.
      const fullText = btn.textContent.trim();
      const boldText = strong ? strong.textContent.trim() : '';
      const descText = fullText.replace(boldText, '').trim()
        .replace(/[\u00a0]+/g, '') // Remove non-breaking spaces
        .replace(/\s+/g, ' ') // Normalize whitespace from <br> tags
        .trim();
      if (descText) {
        const desc = document.createElement('p');
        desc.textContent = descText;
        bodyContent.push(desc);
      }
    }

    if (img || bodyContent.length > 0) {
      rows.push([img || '', bodyContent.length > 0 ? bodyContent : '']);
    }
  }

  if (rows.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-resource',
    cells: rows,
  });
  element.replaceWith(block);
}
