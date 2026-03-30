/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsCarouselParser from './parsers/cards-carousel.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/ancestry-cleanup.js';
import sectionsTransformer from './transformers/ancestry-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-carousel': cardsCarouselParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'content-hub',
  description: 'Content hub page (Ancestry Academy) with hero, featured story, 7 category carousels, and dual CTA section',
  urls: [
    'https://www.ancestry.com/c/discover',
  ],
  blocks: [
    {
      name: 'cards-carousel',
      instances: [
        '#genealogy101',
        '#createcarousel',
        '#factFindingCarousel',
        '#dnaandyouCarousel',
        '#ancestryPresentsCarousel',
        '#customerStoriesCarousel',
        '#perspectivesCarousel',
      ],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: '.container-media-cb2152ed38',
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Featured Story',
      selector: '.container-media-bd1d2bf61e',
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Genealogy 101',
      selector: '.container-media-69b1732857',
      style: null,
      blocks: ['cards-carousel'],
      defaultContent: [],
    },
    {
      id: 'section-4',
      name: 'Create & Connect',
      selector: '.container-media-81299151dc',
      style: 'warm-beige',
      blocks: ['cards-carousel'],
      defaultContent: [],
    },
    {
      id: 'section-5',
      name: 'Last Name Search',
      selector: '.container-media-c293712ae2',
      style: 'dark',
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-6',
      name: 'Fact Finding',
      selector: '.container-media-f9a224f9aa',
      style: null,
      blocks: ['cards-carousel'],
      defaultContent: [],
    },
    {
      id: 'section-7',
      name: 'DNA & You',
      selector: '.container-media-1a683fa285',
      style: null,
      blocks: ['cards-carousel'],
      defaultContent: [],
    },
    {
      id: 'section-8',
      name: 'Ancestry Presents',
      selector: '.container-media-9be0de11f3',
      style: null,
      blocks: ['cards-carousel'],
      defaultContent: [],
    },
    {
      id: 'section-9',
      name: 'Customer Stories',
      selector: '.container-media-9f8e496a43',
      style: null,
      blocks: ['cards-carousel'],
      defaultContent: [],
    },
    {
      id: 'section-10',
      name: 'Build Your Tree',
      selector: '.container-media-e8ca6d6392',
      style: 'dark',
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-11',
      name: 'Perspectives',
      selector: '.container-media-7f41fcb14f',
      style: null,
      blocks: ['cards-carousel'],
      defaultContent: [],
    },
    {
      id: 'section-12',
      name: 'Dual CTA',
      selector: '.container-media-99ec9fcf53',
      style: 'dark',
      blocks: [],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
          });
        });
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
      }
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    // 4. Execute afterTransform transformers
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
