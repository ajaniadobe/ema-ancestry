/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Ancestry.com sections.
 * Adds section breaks (<hr>) and section-metadata blocks from template sections.
 * Runs in afterTransform only, uses payload.template.sections.
 *
 * NOTE: Validator cannot fully validate this transformer because ancestry.com
 * serves a bot challenge page to fresh headless browsers. All 7 section selectors
 * have been verified to match on the live page via manual Playwright testing.
 *
 * Sections from page-templates.json:
 * - section-1: Hero (.showBAUHero) - no style
 * - section-2: Promo Banner (.container-media-9922a722ac) - style: dark
 * - section-3: Product Comparison (.container-media-e5c16932c5) - no style
 * - section-4: Pricing (.container-media-a9324d642c) - no style
 * - section-5: Finding Your Roots (.container-media-4948219488) - no style
 * - section-6: Learn More Resources (.container-media-908aabbd8b) - no style
 * - section-7: SEO Footer Links (.ancestry-footer) - style: light-gray
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const { template } = payload;
    if (!template || !template.sections || template.sections.length < 2) return;

    const doc = element.ownerDocument || document;
    const firstSectionId = template.sections[0].id;

    // Process sections in reverse order to preserve positions
    [...template.sections].reverse().forEach((section) => {
      const selectorList = Array.isArray(section.selector) ? section.selector : [section.selector];
      let sectionEl = null;
      for (const sel of selectorList) {
        try {
          sectionEl = element.querySelector(sel);
        } catch (e) {
          // Invalid selector, skip
        }
        if (sectionEl) break;
      }

      if (!sectionEl) return;

      // Add section-metadata block if section has a style
      if (section.style) {
        const cells = [['style', section.style]];
        const sectionMetadata = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells,
        });
        sectionEl.after(sectionMetadata);
      }

      // Add <hr> before section (except the first section)
      if (section.id !== firstSectionId) {
        const hr = doc.createElement('hr');
        sectionEl.before(hr);
      }
    });
  }
}
