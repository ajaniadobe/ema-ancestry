/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsResourceParser from './parsers/cards-resource.js';
import columnsLinksDirectoryParser from './parsers/columns-links-directory.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/ancestry-cleanup.js';
import sectionsTransformer from './transformers/ancestry-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-resource': cardsResourceParser,
  'columns-links': columnsLinksDirectoryParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'learning-directory',
  description: 'SEO content directory page with hero banner, featured article cards, 3-column categorized link directory with 56+ links, and cross-promotion cards',
  urls: [
    'https://www.ancestry.com/c/dna-learning-hub',
  ],
  blocks: [
    {
      name: 'cards-resource',
      instances: [
        '.container-media-e504a12523 .itemlist.equalHeightCons',
        '#learningHubResources .itemlist',
      ],
    },
    {
      name: 'columns-links',
      instances: [
        '#learningHubLinkLists .itemlist',
      ],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero Intro',
      selector: '.container-media-e504a12523',
      style: null,
      blocks: ['cards-resource'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'DNA Directory',
      selector: '.container-media-6957c9614b',
      style: 'light-gray',
      blocks: ['columns-links'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Going Beyond',
      selector: '.container-media-edeae4453a',
      style: null,
      blocks: ['cards-resource'],
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
