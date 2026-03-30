/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroGradientParser from './parsers/hero-gradient.js';
import stepsParser from './parsers/steps-getting-started.js';
import youtubeQuoteParser from './parsers/youtube-quote.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/ancestry-cleanup.js';
import sectionsTransformer from './transformers/ancestry-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-gradient': heroGradientParser,
  'steps': stepsParser,
  'youtube': youtubeQuoteParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'product-landing',
  description: 'Product landing page with hero, tutorial steps, discovery content, video testimonial, and conversion CTA section',
  urls: [
    'https://www.ancestry.com/c/ancestry-family',
  ],
  blocks: [
    {
      name: 'hero-gradient',
      instances: ['.container-media-9dc900d33c .container-media-4456a86b40'],
    },
    {
      name: 'steps',
      instances: ['.container-media-151fc3002f section.hide768'],
    },
    {
      name: 'youtube',
      instances: ['.container-media-2bd99ee711 .itemlist'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: '.container-media-9dc900d33c',
      style: null,
      blocks: ['hero-gradient'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Getting Started',
      selector: '.container-media-151fc3002f',
      style: null,
      blocks: ['steps'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Discovery',
      selector: '.container-media-276fd208ba',
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-4',
      name: 'Video Testimonial',
      selector: '.container-media-2bd99ee711',
      style: null,
      blocks: ['youtube'],
      defaultContent: [],
    },
    {
      id: 'section-5',
      name: 'Logo Strip',
      selector: '.container-media-921724d3e0',
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-6',
      name: 'CTA',
      selector: '.container-media-c8a9807e92',
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
