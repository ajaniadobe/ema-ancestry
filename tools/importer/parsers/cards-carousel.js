/* eslint-disable */
/* global WebImporter */
/**
 * Parser for category carousel blocks on content-hub page.
 * Source: https://www.ancestry.com/c/discover
 *
 * Converts Ancestry carousel slides into a cards-resource block.
 * Each carousel has 3-5 slides containing article/video cards with:
 *   - Background image (extracted to <img> by cleanup step 0a)
 *   - Wrapping <a> link (cmp-container__container-full-width-link)
 *   - Type label (ARTICLE, VIDEO, DEEPER DIVE, VIDEO SERIES)
 *   - Title text (bold/strong or h2)
 *   - Read/watch time badge (e.g., "6 MIN READ", "3 MIN WATCH")
 *
 * Targets carousels by ID: genealogy101, createcarousel,
 * factFindingCarousel, dnaandyouCarousel, ancestryPresentsCarousel,
 * customerStoriesCarousel, perspectivesCarousel.
 */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('li.carouselSlide, .carouselSlide');
  if (slides.length === 0) return;

  const cells = [];

  slides.forEach((slide) => {
    // Find image (from step 0a background extraction or existing <img>)
    const img = slide.querySelector('img');

    // Find wrapping link
    const link = slide.querySelector('a.cmp-container__container-full-width-link')
      || slide.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : '';

    // Extract text content from .cmp-text paragraphs
    const texts = [];
    slide.querySelectorAll('.cmp-text p, .cmp-text h2').forEach((p) => {
      const text = p.textContent.trim();
      if (text) texts.push({ text, el: p });
    });

    if (texts.length === 0 && !img) return;

    // Build image cell
    const imageCell = [];
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.getAttribute('src') || '';
      newImg.alt = img.getAttribute('alt') || '';
      imageCell.push(newImg);
    }

    // Build body cell
    const bodyCell = [];

    // Classify text elements
    const typeLabels = ['ARTICLE', 'VIDEO', 'DEEPER DIVE', 'VIDEO SERIES'];
    let titleText = '';
    let typeText = '';
    let timeText = '';
    const descTexts = [];

    texts.forEach(({ text }) => {
      if (typeLabels.includes(text.toUpperCase())) {
        typeText = text;
      } else if (/\d+\s*(?:\+\s*)?MIN\s/i.test(text)) {
        timeText = text;
      } else if (!titleText) {
        // First non-type, non-time text is the title
        titleText = text;
      } else {
        descTexts.push(text);
      }
    });

    // Create body elements
    if (typeText) {
      const p = document.createElement('p');
      p.textContent = typeText;
      bodyCell.push(p);
    }

    if (titleText) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h3.appendChild(a);
      } else {
        h3.textContent = titleText;
      }
      bodyCell.push(h3);
    }

    descTexts.forEach((desc) => {
      const p = document.createElement('p');
      p.textContent = desc;
      bodyCell.push(p);
    });

    if (timeText) {
      const p = document.createElement('p');
      p.textContent = timeText;
      bodyCell.push(p);
    }

    if (imageCell.length > 0 || bodyCell.length > 0) {
      cells.push([imageCell, bodyCell]);
    }
  });

  if (cells.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-resource',
    cells,
  });
  element.replaceWith(block);
}
