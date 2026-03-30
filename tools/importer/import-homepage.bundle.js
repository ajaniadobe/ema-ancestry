var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-gradient.js
  function parse(element, { document: document2 }) {
    const h1 = element.querySelector("h1");
    if (!h1) return;
    const heroContent = h1.parentElement;
    const contentCell = [h1];
    const paragraphs = Array.from(heroContent.querySelectorAll("p")).filter((p) => !p.closest("a") && p.textContent.trim().length > 0);
    if (paragraphs[0]) contentCell.push(paragraphs[0]);
    const cta = heroContent.querySelector("a[href]");
    if (cta) contentCell.push(cta);
    for (let i = 1; i < paragraphs.length; i++) {
      contentCell.push(paragraphs[i]);
    }
    const cells = [contentCell];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-gradient", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-product.js
  function parse2(element, { document: document2 }) {
    const sibling = element.parentElement?.querySelector(".container-media-441f9d91fa");
    function extractContent(col) {
      const content = [];
      const seen = /* @__PURE__ */ new Set();
      const paragraphs = Array.from(col.querySelectorAll("p")).filter((p) => !p.closest("a") && !p.closest(".cmp-button__text") && p.textContent.trim().length > 0);
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (!seen.has(text)) {
          seen.add(text);
          content.push(p);
        }
      });
      const cta = col.querySelector("a[href]");
      if (cta) content.push(cta);
      return content;
    }
    const col1Content = extractContent(element);
    const col2Content = sibling ? extractContent(sibling) : [];
    const cells = [
      [col1Content, col2Content]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-product", cells });
    element.replaceWith(block);
    if (sibling) sibling.remove();
  }

  // tools/importer/parsers/card-promo.js
  function parse3(element, { document: document2 }) {
    const img = element.querySelector("img");
    const heading = element.querySelector("h3, h2");
    const seen = /* @__PURE__ */ new Set();
    const paragraphs = Array.from(element.querySelectorAll("p")).filter((p) => {
      if (p.closest("a") || p.closest(".cmp-button__text")) return false;
      const text = p.textContent.trim();
      if (text.length === 0 || seen.has(text)) return false;
      seen.add(text);
      return true;
    });
    const cta = element.querySelector("a[href]");
    const imageCell = img || "";
    const textCell = [];
    if (heading) textCell.push(heading);
    paragraphs.forEach((p) => textCell.push(p));
    if (cta) textCell.push(cta);
    const cells = [
      [imageCell, textCell]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "card-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-pricing.js
  function parse4(element, { document: document2 }) {
    const cardWrappers = element.querySelectorAll(":scope > .cmp-item-list__item-wrapper");
    const cells = [];
    cardWrappers.forEach((wrapper) => {
      const card = wrapper.querySelector('[class*="container-media-"]');
      if (!card) return;
      const cardContent = [];
      const seen = /* @__PURE__ */ new Set();
      card.querySelectorAll("p, ul").forEach((el) => {
        if (el.tagName === "P" && el.closest("a")) return;
        const text = el.textContent.trim();
        if (text.length === 0 || seen.has(text)) return;
        seen.add(text);
        cardContent.push(el);
      });
      const cta = card.querySelector("a[href]");
      if (cta) {
        const ctaText = cta.textContent.trim();
        if (!seen.has(ctaText)) {
          seen.add(ctaText);
        }
        cardContent.push(cta);
      }
      const allParagraphs = Array.from(card.querySelectorAll("p")).filter((p) => !p.closest("a") && p.textContent.trim().startsWith("*"));
      allParagraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (!seen.has(text)) {
          seen.add(text);
          cardContent.push(p);
        }
      });
      if (cardContent.length > 0) {
        cells.push([cardContent]);
      }
    });
    if (cells.length === 0) return;
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-pricing", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-links.js
  function parse5(element, { document: document2 }) {
    const linklists = element.querySelectorAll(".linklist");
    if (linklists.length === 0) return;
    const columnCells = [];
    linklists.forEach((ll) => {
      const container = ll.closest(".cmp-container__container-content") || ll.parentElement;
      const h2 = container.querySelector("h2");
      const linkList = ll.querySelector("ul") || ll.querySelector(".ancestry-cmp-link-list");
      const cellContent = [];
      if (h2) cellContent.push(h2);
      if (linkList) cellContent.push(linkList);
      if (cellContent.length > 0) {
        columnCells.push(cellContent);
      }
    });
    if (columnCells.length === 0) return;
    const cells = [columnCells];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-links", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/ancestry-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      let cssAvailable = false;
      const hiddenByCSS = /* @__PURE__ */ new Set();
      element.querySelectorAll('[class*="container-media"]').forEach((el) => {
        try {
          const style = el.ownerDocument.defaultView?.getComputedStyle(el);
          if (style && style.display === "none") {
            hiddenByCSS.add(el);
            cssAvailable = true;
          }
        } catch (e) {
        }
      });
      element.querySelectorAll('[class*="show480"], [class*="show768"], [class*="hide768"], [class*="hide480"]').forEach((el) => {
        try {
          const style = el.ownerDocument.defaultView?.getComputedStyle(el);
          if (style && style.display === "none") {
            hiddenByCSS.add(el);
            cssAvailable = true;
          }
        } catch (e) {
        }
      });
      hiddenByCSS.forEach((el) => el.remove());
      element.querySelectorAll('[class*="bkgsize"] .cmp-container').forEach((inner) => {
        try {
          const style = inner.ownerDocument.defaultView?.getComputedStyle(inner);
          if (style) {
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== "none") {
              const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
              if (match) {
                let url = match[1];
                if (url.startsWith("//")) url = `https:${url}`;
                const img = inner.ownerDocument.createElement("img");
                img.src = url;
                const bkgParent = inner.closest('[class*="bkgsize"]');
                if (bkgParent) bkgParent.prepend(img);
              }
            }
          }
        } catch (e) {
        }
      });
      element.querySelectorAll(".carouselSlide").forEach((slide) => {
        if (slide.querySelector("img")) return;
        const containers = slide.querySelectorAll('.cmp-container[class*="container-media"]');
        for (const inner of containers) {
          try {
            const style = inner.ownerDocument.defaultView?.getComputedStyle(inner);
            if (style) {
              const bgImage = style.backgroundImage;
              if (bgImage && bgImage !== "none") {
                const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
                if (match) {
                  let url = match[1];
                  if (url.startsWith("//")) url = `https:${url}`;
                  const img = inner.ownerDocument.createElement("img");
                  img.src = url;
                  slide.prepend(img);
                  break;
                }
              }
            }
          } catch (e) {
          }
        }
      });
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        'link[rel="stylesheet"]',
        'link[rel="preload"]',
        'link[rel="prefetch"]',
        "meta"
      ]);
      element.querySelectorAll('iframe[src*="youtube"]').forEach((iframe) => {
        const src = iframe.getAttribute("src") || "";
        const match = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?/]+)/);
        if (match) {
          const a = iframe.ownerDocument.createElement("a");
          a.href = `https://www.youtube.com/watch?v=${match[1]}`;
          a.textContent = `https://www.youtube.com/watch?v=${match[1]}`;
          iframe.replaceWith(a);
        }
      });
      if (!cssAvailable) {
        WebImporter.DOMUtils.remove(element, [
          '[class*="show480"]',
          '[class*="show768"]'
        ]);
      }
      WebImporter.DOMUtils.remove(element, [
        ".aem-GridColumn--default--hide"
      ]);
      element.querySelectorAll('[class*="adobe-target-experience"]').forEach((container) => {
        const cls = container.className || "";
        if (!cls.includes("showBAU")) {
          container.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [".noDisplay"]);
      WebImporter.DOMUtils.remove(element, [".spacer"]);
      element.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        const isPlaceholder = src.startsWith("data:image/") || src === "" || src.startsWith("blob:");
        if (isPlaceholder) {
          const realSrc = img.getAttribute("data-src") || img.getAttribute("data-lazy") || img.getAttribute("data-original");
          if (realSrc) {
            img.setAttribute("src", realSrc);
          } else {
            const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
            const firstSrc = srcset.split(",")[0]?.trim().split(" ")[0];
            if (firstSrc && !firstSrc.startsWith("data:") && !firstSrc.startsWith("blob:")) {
              img.setAttribute("src", firstSrc);
            } else if (isPlaceholder) {
              const parent = img.parentElement;
              img.remove();
              if (parent && parent.textContent.trim() === "" && parent.children.length === 0) {
                parent.remove();
              }
            }
          }
        }
        if (img.parentElement) {
          const cleanSrc = img.getAttribute("src") || "";
          if (cleanSrc.includes("%22") || cleanSrc.includes('\\"')) {
            img.setAttribute("src", cleanSrc.replace(/%22/g, "").replace(/\\"/g, "").replace(/^"/, "").replace(/"$/, ""));
          }
        }
      });
      element.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || "";
        const isTracker = src.includes("ispot.tv") || src.includes("bat.bing.com") || src.includes("sp.analytics.yahoo.com") || src.includes("facebook.com/tr") || src.includes("doubleclick.net") || src.includes("google-analytics.com") || src.includes("googleadservices.com") || src.includes("tiktok.com") || src.includes("demdex.net") || src.includes("scorecardresearch.com") || alt === "dot image pixel" || alt === "" && src.startsWith("data:image/gif");
        if (isTracker) {
          const parent = img.parentElement;
          img.remove();
          if (parent && parent.tagName === "P" && parent.textContent.trim() === "" && parent.children.length === 0) {
            parent.remove();
          }
        }
      });
      element.querySelectorAll("p, span, div").forEach((el) => {
        const text = el.textContent.trim();
        if (text.startsWith("Suggested Actions") || text === "Terms, privacy, & more") {
          el.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [
        'nav[aria-label="Breadcrumb"]',
        ".cmp-breadcrumb"
      ]);
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (href.includes("%5C%22") || href.includes("%22") || href.includes('\\"')) {
          a.setAttribute("href", href.replace(/%5C%22/g, "").replace(/%22/g, "").replace(/\\"/g, ""));
        }
      });
      element.querySelectorAll("svg").forEach((svg) => {
        const parent = svg.parentElement;
        svg.remove();
        if (parent && parent.textContent.trim() === "" && parent.children.length === 0) {
          parent.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [".hideVisually"]);
      element.querySelectorAll("p, span, div").forEach((el) => {
        const text = el.textContent.trim();
        if (text === "Previous slideNext slide" || text === "PreviousNext") {
          el.remove();
        }
      });
      element.querySelectorAll("li").forEach((li) => {
        const text = li.textContent.trim();
        if (/^Slide \d+$/.test(text) || text === "") {
          li.remove();
        }
      });
      element.querySelectorAll("ul, ol").forEach((list) => {
        if (list.children.length === 0 && list.textContent.trim() === "") {
          list.remove();
        }
      });
      element.querySelectorAll('a[href="javascript:void(0)"]').forEach((a) => {
        while (a.firstChild) {
          a.parentNode.insertBefore(a.firstChild, a);
        }
        a.remove();
      });
      element.querySelectorAll('[class*="container-media"]').forEach((el) => {
        const next = el.nextElementSibling;
        if (!next) return;
        if (!(next.className || "").includes("container-media")) return;
        const textA = el.textContent.replace(/\s+/g, " ").trim();
        const textB = next.textContent.replace(/\s+/g, " ").trim();
        if (textA && textB && textA === textB) {
          next.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll("header, footer").forEach((wrapper) => {
        if (wrapper.querySelector("main") || wrapper.children.length > 3) {
          while (wrapper.firstChild) {
            wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
          }
          wrapper.remove();
        } else {
          wrapper.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, ["#stickyFooter"]);
      WebImporter.DOMUtils.remove(element, [
        "nav",
        "link",
        "iframe"
      ]);
      element.querySelectorAll(".experiencefragment").forEach((frag) => {
        if (!frag.closest("main")) {
          frag.remove();
        }
      });
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-is");
        el.removeAttribute("data-event-enabled");
        el.removeAttribute("data-event-target-attribute-values");
        el.removeAttribute("data-visibility-no-activate");
      });
      element.querySelectorAll("div").forEach((div) => {
        if (div.children.length === 0 && div.textContent.trim() === "") {
          div.remove();
        }
      });
      element.querySelectorAll("p, span, div").forEach((el) => {
        const text = el.textContent.trim();
        if (text === "Terms, privacy, & more" || text.startsWith("Suggested Actions")) {
          el.remove();
        }
      });
      const seenHeadings = /* @__PURE__ */ new Map();
      element.querySelectorAll("h1, h2, h3").forEach((h) => {
        const text = h.textContent.replace(/\s+/g, " ").trim();
        if (text.length < 10) return;
        if (seenHeadings.has(text)) {
          const toRemove = [h];
          let sib = h.nextElementSibling;
          while (sib && !/^H[1-6]$/.test(sib.tagName) && sib.tagName !== "HR") {
            toRemove.push(sib);
            sib = sib.nextElementSibling;
          }
          toRemove.forEach((el) => el.remove());
        } else {
          seenHeadings.set(text, h);
        }
      });
      ["ul", "ol"].forEach((tag) => {
        element.querySelectorAll(tag).forEach((el) => {
          const next = el.nextElementSibling;
          if (!next || next.tagName !== el.tagName) return;
          const textA = el.textContent.replace(/\s+/g, " ").trim();
          const textB = next.textContent.replace(/\s+/g, " ").trim();
          if (textA.length > 10 && textA === textB) {
            next.remove();
          }
        });
      });
    }
  }

  // tools/importer/transformers/ancestry-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { template } = payload;
      if (!template || !template.sections || template.sections.length < 2) return;
      const doc = element.ownerDocument || document;
      const firstSectionId = template.sections[0].id;
      [...template.sections].reverse().forEach((section) => {
        const selectorList = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectorList) {
          try {
            sectionEl = element.querySelector(sel);
          } catch (e) {
          }
          if (sectionEl) break;
        }
        if (!sectionEl) return;
        if (section.style) {
          const cells = [["style", section.style]];
          const sectionMetadata = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells
          });
          sectionEl.after(sectionMetadata);
        }
        if (section.id !== firstSectionId) {
          const hr = doc.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-gradient": parse,
    "columns-product": parse2,
    "card-promo": parse3,
    "cards-pricing": parse4,
    "columns-links": parse5
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Marketing homepage with hero, product comparison columns, pricing cards, promotional sections, resource cards, and SEO footer links",
    urls: [
      "https://www.ancestry.com/"
    ],
    blocks: [
      {
        name: "hero-gradient",
        instances: [".showBAUHero .a250-gradient"]
      },
      {
        name: "columns-product",
        instances: [".container-media-08aa36823a"]
      },
      {
        name: "card-promo",
        instances: [".container-media-788b206008", ".container-media-4948219488"]
      },
      {
        name: "cards-pricing",
        instances: [".container-media-a9324d642c .cmp-item-list__items"]
      },
      {
        name: "columns-links",
        instances: [".ancestry-footer"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero",
        selector: ".showBAUHero",
        style: null,
        blocks: ["hero-gradient"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Promo Banner",
        selector: ".container-media-9922a722ac",
        style: "dark",
        blocks: [],
        defaultContent: [".container-media-9922a722ac .text", ".container-media-9922a722ac .button"]
      },
      {
        id: "section-3",
        name: "Product Comparison + Preserve Promo",
        selector: ".container-media-e5c16932c5",
        style: null,
        blocks: ["columns-product", "card-promo"],
        defaultContent: [".container-media-e5c16932c5 > .cmp-container__container-content > h2", ".container-media-e5c16932c5 > .cmp-container__container-content > p"]
      },
      {
        id: "section-4",
        name: "Pricing",
        selector: ".container-media-a9324d642c",
        style: null,
        blocks: ["cards-pricing"],
        defaultContent: [".container-media-a9324d642c > h2", ".container-media-a9324d642c > p"]
      },
      {
        id: "section-5",
        name: "Finding Your Roots",
        selector: ".container-media-4948219488",
        style: null,
        blocks: ["card-promo"],
        defaultContent: []
      },
      {
        id: "section-6",
        name: "Learn More Resources",
        selector: ".container-media-908aabbd8b",
        style: null,
        blocks: [],
        defaultContent: [".container-media-908aabbd8b > h2", ".container-media-908aabbd8b > p"]
      },
      {
        id: "section-7",
        name: "SEO Footer Links",
        selector: ".ancestry-footer",
        style: "light-gray",
        blocks: ["columns-links"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = {
      ...payload,
      template: PAGE_TEMPLATE
    };
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        try {
          const elements = document2.querySelectorAll(selector);
          elements.forEach((element) => {
            pageBlocks.push({
              name: blockDef.name,
              selector,
              element
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
  var import_homepage_default = {
    transform: (payload) => {
      const { document: document2, url, html, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path: path || "/index",
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
