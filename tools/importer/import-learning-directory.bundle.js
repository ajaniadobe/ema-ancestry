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

  // tools/importer/import-learning-directory.js
  var import_learning_directory_exports = {};
  __export(import_learning_directory_exports, {
    default: () => import_learning_directory_default
  });

  // tools/importer/parsers/cards-resource.js
  function parse(element, { document: document2 }) {
    if (!element.parentNode) return;
    const items = [...element.querySelectorAll(".cmp-item-list__item")];
    let next = element.nextElementSibling;
    while (next) {
      if (next.classList.contains("itemlist") && next.classList.contains("equalHeightCons")) {
        items.push(...next.querySelectorAll(".cmp-item-list__item"));
        const toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      } else {
        break;
      }
    }
    if (items.length === 0) return;
    const rows = [];
    items.forEach((item) => {
      let img = null;
      const bgContainer = item.querySelector(".bkgsizeCover");
      if (bgContainer) {
        const styleTag = bgContainer.querySelector("style");
        if (styleTag) {
          const match = styleTag.textContent.match(
            /background-image\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/
          );
          if (match) {
            let url = match[1];
            if (url.startsWith("//")) url = `https:${url}`;
            img = document2.createElement("img");
            img.src = url;
          }
        }
      }
      if (!img) {
        img = item.querySelector(".cmp-image__image") || item.querySelector("img");
      }
      const bodyContent = [];
      const heading = item.querySelector("h3, h2");
      if (heading) bodyContent.push(heading);
      const cmpTexts = item.querySelectorAll(".cmp-text");
      cmpTexts.forEach((ct) => {
        ct.querySelectorAll("p").forEach((p) => {
          if (p.closest("h3") || p.closest("h2")) return;
          if (p.textContent.trim()) bodyContent.push(p);
        });
      });
      if (img || bodyContent.length > 0) {
        rows.push([img || "", bodyContent.length > 0 ? bodyContent : ""]);
      }
    });
    if (rows.length === 0) return;
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "cards-resource",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-links-directory.js
  function parse2(element, { document: document2 }) {
    const items = element.querySelectorAll(".cmp-item-list__item");
    if (items.length === 0) return;
    const columnCells = [];
    items.forEach((item) => {
      const cellContent = [];
      item.querySelectorAll(".cmp-text").forEach((ct) => {
        ct.querySelectorAll("h3, ul").forEach((el) => {
          cellContent.push(el);
        });
      });
      if (cellContent.length > 0) {
        columnCells.push(cellContent);
      }
    });
    if (columnCells.length === 0) return;
    const cells = [columnCells];
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "columns-links",
      cells
    });
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

  // tools/importer/import-learning-directory.js
  var parsers = {
    "cards-resource": parse,
    "columns-links": parse2
  };
  var PAGE_TEMPLATE = {
    name: "learning-directory",
    description: "SEO content directory page with hero banner, featured article cards, 3-column categorized link directory with 56+ links, and cross-promotion cards",
    urls: [
      "https://www.ancestry.com/c/dna-learning-hub"
    ],
    blocks: [
      {
        name: "cards-resource",
        instances: [
          ".container-media-e504a12523 .itemlist.equalHeightCons",
          "#learningHubResources .itemlist"
        ]
      },
      {
        name: "columns-links",
        instances: [
          "#learningHubLinkLists .itemlist"
        ]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero Intro",
        selector: ".container-media-e504a12523",
        style: null,
        blocks: ["cards-resource"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "DNA Directory",
        selector: ".container-media-6957c9614b",
        style: "light-gray",
        blocks: ["columns-links"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "Going Beyond",
        selector: ".container-media-edeae4453a",
        style: null,
        blocks: ["cards-resource"],
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
  var import_learning_directory_default = {
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
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_learning_directory_exports);
})();
