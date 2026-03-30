/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Ancestry.com cleanup.
 * Universal cleanup for all Ancestry.com page templates.
 *
 * Handles:
 * - Hidden viewport duplicates (mobile/tablet variants removed, desktop kept)
 * - A/B test variant containers (non-BAU)
 * - Tracking pixels and analytics images
 * - Non-authorable site chrome (header, footer, nav, scripts)
 * - "Suggested Actions" consent/bot-challenge text
 * - Breadcrumb navigation
 * - Data attributes cleanup
 * - blob: image URL placeholders (created by Ancestry JS at runtime)
 * - Carousel pagination artifacts ("Previous slideNext slide", "Slide N")
 * - javascript:void(0) dead links (video modal triggers, unwrapped to preserve content)
 * - Viewport duplicate sibling deduplication (identical adjacent container-media elements)
 *
 * Ancestry viewport class convention:
 *   show480 = visible at ≤480px (mobile only) → REMOVE for desktop
 *   show768 = visible at ≤768px (mobile/tablet) → REMOVE for desktop
 *   hide768 = hidden at ≤768px (desktop only) → KEEP for desktop
 *   hide480 = hidden at ≤480px (tablet+desktop) → KEEP for desktop
 *   noDisplay = A/B test hidden variant → REMOVE
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // 1. Remove hidden viewport duplicates.
    // MUST run BEFORE removing <style>/<link> so getComputedStyle still works.
    // Ancestry serves 2-4 viewport duplicates per section (mobile/tablet/desktop).
    // At 1920x1080 desktop, mobile/tablet variants have display:none via CSS.
    let cssAvailable = false;
    const hiddenByCSS = new Set();
    element.querySelectorAll('[class*="container-media"]').forEach((el) => {
      try {
        const style = el.ownerDocument.defaultView?.getComputedStyle(el);
        if (style && style.display === 'none') {
          hiddenByCSS.add(el);
          cssAvailable = true;
        }
      } catch (e) { /* CSS not loaded */ }
    });
    // Also check elements with show/hide viewport classes
    element.querySelectorAll('[class*="show480"], [class*="show768"], [class*="hide768"], [class*="hide480"]').forEach((el) => {
      try {
        const style = el.ownerDocument.defaultView?.getComputedStyle(el);
        if (style && style.display === 'none') {
          hiddenByCSS.add(el);
          cssAvailable = true;
        }
      } catch (e) { /* CSS not loaded */ }
    });
    // Remove the elements we detected as hidden
    hiddenByCSS.forEach((el) => el.remove());

    // 0a. Extract background images from CSS before removing <style> tags.
    // Ancestry uses <style> tags with background-image rules on .bkgsizeCover
    // and .bkgsizeContain containers for card images and carousel slides.
    // Convert to <img> elements before styles are gone.
    element.querySelectorAll('[class*="bkgsize"] .cmp-container').forEach((inner) => {
      try {
        const style = inner.ownerDocument.defaultView?.getComputedStyle(inner);
        if (style) {
          const bgImage = style.backgroundImage;
          if (bgImage && bgImage !== 'none') {
            const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
            if (match) {
              let url = match[1];
              if (url.startsWith('//')) url = `https:${url}`;
              const img = inner.ownerDocument.createElement('img');
              img.src = url;
              const bkgParent = inner.closest('[class*="bkgsize"]');
              if (bkgParent) bkgParent.prepend(img);
            }
          }
        }
      } catch (e) { /* CSS not available */ }
    });

    // 0a2. Extract background images from fullWidth carousel slides.
    // FullWidth carousels (Create & Connect, DNA & You, Customer Stories) don't
    // use bkgsize* wrapper classes, so step 0a misses them. Extract the first
    // background-image from each carousel slide that doesn't already have an <img>.
    element.querySelectorAll('.carouselSlide').forEach((slide) => {
      if (slide.querySelector('img')) return; // Already has an image from step 0a
      // Find the first container-media with a real background-image
      const containers = slide.querySelectorAll('.cmp-container[class*="container-media"]');
      for (const inner of containers) {
        try {
          const style = inner.ownerDocument.defaultView?.getComputedStyle(inner);
          if (style) {
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
              const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
              if (match) {
                let url = match[1];
                if (url.startsWith('//')) url = `https:${url}`;
                const img = inner.ownerDocument.createElement('img');
                img.src = url;
                slide.prepend(img);
                break; // One image per slide
              }
            }
          }
        } catch (e) { /* CSS not available */ }
      }
    });

    // 0. Now remove scripts, styles, noscript tags (after computed style checks)
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link[rel="stylesheet"]',
      'link[rel="preload"]',
      'link[rel="prefetch"]',
      'meta',
    ]);

    // 0b. Convert YouTube iframes to links BEFORE parsers run.
    // YouTube embeds need to survive as <a> links for the youtube block parser.
    // Must happen in beforeTransform so parsers can find the links.
    element.querySelectorAll('iframe[src*="youtube"]').forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      const match = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?/]+)/);
      if (match) {
        const a = iframe.ownerDocument.createElement('a');
        a.href = `https://www.youtube.com/watch?v=${match[1]}`;
        a.textContent = `https://www.youtube.com/watch?v=${match[1]}`;
        iframe.replaceWith(a);
      }
    });

    // 1b. Class-based fallback ONLY if CSS was not available.
    // When CSS loads, getComputedStyle is authoritative — skip class heuristics.
    // When CSS doesn't load, use class patterns to remove mobile/tablet-only content.
    // IMPORTANT: hide768/hide480 = "hidden on small screens" = DESKTOP content → KEEP!
    if (!cssAvailable) {
      // Remove mobile-only content (shown only at small breakpoints)
      WebImporter.DOMUtils.remove(element, [
        '[class*="show480"]',
        '[class*="show768"]',
      ]);
      // Note: hide768 and hide480 are DESKTOP content — do NOT remove them
    }

    // 1c. Remove elements hidden at the default (desktop) breakpoint via AEM grid.
    // aem-GridColumn--default--hide = hidden on desktop, shown on mobile = mobile-only.
    // Always run regardless of CSS availability since this is a reliable class indicator.
    WebImporter.DOMUtils.remove(element, [
      '.aem-GridColumn--default--hide',
    ]);

    // 2. Remove non-BAU A/B test variants (keep showBAUHero and showBAUBody)
    element.querySelectorAll('[class*="adobe-target-experience"]').forEach((container) => {
      const cls = container.className || '';
      if (!cls.includes('showBAU')) {
        container.remove();
      }
    });

    // 2b. Remove noDisplay elements (hidden A/B test variants)
    WebImporter.DOMUtils.remove(element, ['.noDisplay']);

    // 3. Remove empty spacer elements
    WebImporter.DOMUtils.remove(element, ['.spacer']);

    // 4. Fix lazy-loaded images: replace data:image/gif placeholders with real src.
    // Ancestry uses multiple lazy-load patterns:
    // - data-src, data-lazy, data-original for standard lazy loading
    // - srcset with real URLs while src has placeholder
    // - blob: URLs created by Ancestry JS at runtime (not real images)
    element.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const isPlaceholder = src.startsWith('data:image/') || src === '' || src.startsWith('blob:');
      if (isPlaceholder) {
        const realSrc = img.getAttribute('data-src')
          || img.getAttribute('data-lazy')
          || img.getAttribute('data-original');
        if (realSrc) {
          img.setAttribute('src', realSrc);
        } else {
          // Try to extract from srcset
          const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
          const firstSrc = srcset.split(',')[0]?.trim().split(' ')[0];
          if (firstSrc && !firstSrc.startsWith('data:') && !firstSrc.startsWith('blob:')) {
            img.setAttribute('src', firstSrc);
          } else if (isPlaceholder) {
            // No real src available — remove the broken image
            const parent = img.parentElement;
            img.remove();
            if (parent && parent.textContent.trim() === '' && parent.children.length === 0) {
              parent.remove();
            }
          }
        }
      }
      // Clean up escaped quotes in src URLs
      if (img.parentElement) { // may have been removed above
        const cleanSrc = img.getAttribute('src') || '';
        if (cleanSrc.includes('%22') || cleanSrc.includes('\\"')) {
          img.setAttribute('src', cleanSrc.replace(/%22/g, '').replace(/\\"/g, '').replace(/^"/, '').replace(/"$/, ''));
        }
      }
    });

    // 5. Remove tracking pixel images (1x1 GIFs, analytics beacons)
    element.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const isTracker = (
        src.includes('ispot.tv') ||
        src.includes('bat.bing.com') ||
        src.includes('sp.analytics.yahoo.com') ||
        src.includes('facebook.com/tr') ||
        src.includes('doubleclick.net') ||
        src.includes('google-analytics.com') ||
        src.includes('googleadservices.com') ||
        src.includes('tiktok.com') ||
        src.includes('demdex.net') ||
        src.includes('scorecardresearch.com') ||
        (alt === 'dot image pixel') ||
        (alt === '' && src.startsWith('data:image/gif'))
      );
      if (isTracker) {
        const parent = img.parentElement;
        img.remove();
        if (parent && parent.tagName === 'P' && parent.textContent.trim() === '' && parent.children.length === 0) {
          parent.remove();
        }
      }
    });

    // 6. Remove "Suggested Actions" text (bot challenge / consent dialog remnant)
    element.querySelectorAll('p, span, div').forEach((el) => {
      const text = el.textContent.trim();
      if (text.startsWith('Suggested Actions') || text === 'Terms, privacy, & more') {
        el.remove();
      }
    });

    // 7. Remove breadcrumb navigation
    WebImporter.DOMUtils.remove(element, [
      'nav[aria-label="Breadcrumb"]',
      '.cmp-breadcrumb',
    ]);

    // 8. Clean up escaped quotes in all anchor hrefs
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href.includes('%5C%22') || href.includes('%22') || href.includes('\\"')) {
        a.setAttribute('href', href.replace(/%5C%22/g, '').replace(/%22/g, '').replace(/\\"/g, ''));
      }
    });

    // 9. Remove SVG-only elements (decorative, not content)
    element.querySelectorAll('svg').forEach((svg) => {
      const parent = svg.parentElement;
      svg.remove();
      if (parent && parent.textContent.trim() === '' && parent.children.length === 0) {
        parent.remove();
      }
    });

    // 10. Remove carousel pagination artifacts.
    // Ancestry carousels use .hideVisually spans for "Previous slide", "Next slide",
    // and "Slide N" screen-reader labels. Remove all .hideVisually content (these are
    // navigation/carousel labels not needed in EDS content).
    WebImporter.DOMUtils.remove(element, ['.hideVisually']);
    // Also catch any remaining pagination text that survived (different markup)
    element.querySelectorAll('p, span, div').forEach((el) => {
      const text = el.textContent.trim();
      if (text === 'Previous slideNext slide' || text === 'PreviousNext') {
        el.remove();
      }
    });
    element.querySelectorAll('li').forEach((li) => {
      const text = li.textContent.trim();
      if (/^Slide \d+$/.test(text) || text === '') {
        li.remove();
      }
    });
    // Clean up empty <ul>/<ol> left after removing slide/empty items
    element.querySelectorAll('ul, ol').forEach((list) => {
      if (list.children.length === 0 && list.textContent.trim() === '') {
        list.remove();
      }
    });

    // 11. Handle javascript:void(0) links (video modal triggers on Ancestry).
    // Unwrap the link to keep the content (text, images) but remove the dead href.
    element.querySelectorAll('a[href="javascript:void(0)"]').forEach((a) => {
      while (a.firstChild) {
        a.parentNode.insertBefore(a.firstChild, a);
      }
      a.remove();
    });

    // 12. Targeted sibling deduplication for viewport duplicates.
    // Ancestry serves 2-3 copies of the same section for different breakpoints.
    // After CSS-based removal (step 1), some duplicates may leak through when
    // CSS doesn't load. Detect adjacent siblings with identical text content
    // and keep only the first.
    element.querySelectorAll('[class*="container-media"]').forEach((el) => {
      const next = el.nextElementSibling;
      if (!next) return;
      // Only deduplicate if both are container-media elements
      if (!(next.className || '').includes('container-media')) return;
      const textA = el.textContent.replace(/\s+/g, ' ').trim();
      const textB = next.textContent.replace(/\s+/g, ' ').trim();
      if (textA && textB && textA === textB) {
        next.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // 10a. Unwrap header/footer elements that are page wrappers (contain <main>).
    // Ancestry wraps the entire page in <header> which is not a nav header.
    // Instead of removing these, move their children up to preserve content.
    element.querySelectorAll('header, footer').forEach((wrapper) => {
      if (wrapper.querySelector('main') || wrapper.children.length > 3) {
        // This is a page wrapper, not a nav header — unwrap it
        while (wrapper.firstChild) {
          wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
        }
        wrapper.remove();
      } else {
        // Small header/footer — likely actual nav chrome, remove it
        wrapper.remove();
      }
    });


    // 10b. (Moved to beforeTransform step 0b)

    // 10c. Remove sticky footer (duplicate CTA that overlays page bottom)
    WebImporter.DOMUtils.remove(element, ['#stickyFooter']);

    // 10d. Remove remaining non-authorable site chrome
    WebImporter.DOMUtils.remove(element, [
      'nav',
      'link',
      'iframe',
    ]);

    // 11. Remove experience fragments that are OUTSIDE <main> (site-level chrome).
    // Ancestry uses experiencefragment class on content sections inside <main> too,
    // so we must only remove those outside <main> (header/footer nav fragments).
    element.querySelectorAll('.experiencefragment').forEach((frag) => {
      if (!frag.closest('main')) {
        frag.remove();
      }
    });

    // 12. Remove tracking/data attributes
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-is');
      el.removeAttribute('data-event-enabled');
      el.removeAttribute('data-event-target-attribute-values');
      el.removeAttribute('data-visibility-no-activate');
    });

    // 13. Remove remaining empty divs (wrappers with no text content)
    element.querySelectorAll('div').forEach((div) => {
      if (div.children.length === 0 && div.textContent.trim() === '') {
        div.remove();
      }
    });

    // 14. Post-transform artifact cleanup.
    // Some artifacts only become visible after parsers/unwrapping runs.
    element.querySelectorAll('p, span, div').forEach((el) => {
      const text = el.textContent.trim();
      if (text === 'Terms, privacy, & more' || text.startsWith('Suggested Actions')) {
        el.remove();
      }
    });

    // 15. Viewport duplicate heading+content deduplication.
    // Ancestry serves mobile/desktop variants of sections. After cleanup, these
    // appear as repeated heading+content blocks. Find all h1-h3 elements globally
    // and remove duplicate headings (along with their trailing content).
    const seenHeadings = new Map();
    element.querySelectorAll('h1, h2, h3').forEach((h) => {
      const text = h.textContent.replace(/\s+/g, ' ').trim();
      if (text.length < 10) return;
      if (seenHeadings.has(text)) {
        // Duplicate heading — remove it and following siblings until next heading or HR
        const toRemove = [h];
        let sib = h.nextElementSibling;
        while (sib && !/^H[1-6]$/.test(sib.tagName) && sib.tagName !== 'HR') {
          toRemove.push(sib);
          sib = sib.nextElementSibling;
        }
        toRemove.forEach((el) => el.remove());
      } else {
        seenHeadings.set(text, h);
      }
    });

    // 15b. Adjacent sibling deduplication for lists.
    // Catch remaining duplicate adjacent list elements.
    ['ul', 'ol'].forEach((tag) => {
      element.querySelectorAll(tag).forEach((el) => {
        const next = el.nextElementSibling;
        if (!next || next.tagName !== el.tagName) return;
        const textA = el.textContent.replace(/\s+/g, ' ').trim();
        const textB = next.textContent.replace(/\s+/g, ' ').trim();
        if (textA.length > 10 && textA === textB) {
          next.remove();
        }
      });
    });
  }
}
