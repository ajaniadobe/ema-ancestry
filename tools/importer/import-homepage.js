/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroGradientParser from './parsers/hero-gradient.js';
import columnsProductParser from './parsers/columns-product.js';
import cardPromoParser from './parsers/card-promo.js';
import cardsPricingParser from './parsers/cards-pricing.js';
import columnsLinksParser from './parsers/columns-links.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/ancestry-cleanup.js';
import sectionsTransformer from './transformers/ancestry-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-gradient': heroGradientParser,
  'columns-product': columnsProductParser,
  'card-promo': cardPromoParser,
  'cards-pricing': cardsPricingParser,
  'columns-links': columnsLinksParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Marketing homepage with hero, product comparison columns, pricing cards, promotional sections, resource cards, and SEO footer links',
  urls: [
    'https://www.ancestry.com/',
  ],
  blocks: [
    {
      name: 'hero-gradient',
      instances: ['.showBAUHero .a250-gradient'],
    },
    {
      name: 'columns-product',
      instances: ['.container-media-08aa36823a'],
    },
    {
      name: 'card-promo',
      instances: ['.container-media-788b206008', '.container-media-4948219488'],
    },
    {
      name: 'cards-pricing',
      instances: ['.container-media-a9324d642c .cmp-item-list__items'],
    },
    {
      name: 'columns-links',
      instances: ['.ancestry-footer'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: '.showBAUHero',
      style: null,
      blocks: ['hero-gradient'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Promo Banner',
      selector: '.container-media-9922a722ac',
      style: 'dark',
      blocks: [],
      defaultContent: ['.container-media-9922a722ac .text', '.container-media-9922a722ac .button'],
    },
    {
      id: 'section-3',
      name: 'Product Comparison + Preserve Promo',
      selector: '.container-media-e5c16932c5',
      style: null,
      blocks: ['columns-product', 'card-promo'],
      defaultContent: ['.container-media-e5c16932c5 > .cmp-container__container-content > h2', '.container-media-e5c16932c5 > .cmp-container__container-content > p'],
    },
    {
      id: 'section-4',
      name: 'Pricing',
      selector: '.container-media-a9324d642c',
      style: null,
      blocks: ['cards-pricing'],
      defaultContent: ['.container-media-a9324d642c > h2', '.container-media-a9324d642c > p'],
    },
    {
      id: 'section-5',
      name: 'Finding Your Roots',
      selector: '.container-media-4948219488',
      style: null,
      blocks: ['card-promo'],
      defaultContent: [],
    },
    {
      id: 'section-6',
      name: 'Learn More Resources',
      selector: '.container-media-908aabbd8b',
      style: null,
      blocks: [],
      defaultContent: ['.container-media-908aabbd8b > h2', '.container-media-908aabbd8b > p'],
    },
    {
      id: 'section-7',
      name: 'SEO Footer Links',
      selector: '.ancestry-footer',
      style: 'light-gray',
      blocks: ['columns-links'],
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

    // 1. Execute beforeTransform transformers (initial cleanup)
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
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (section breaks + final cleanup)
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
      path: path || '/index',
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
