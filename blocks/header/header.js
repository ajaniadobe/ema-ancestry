import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const { locale } = getConfig();
const HEADER_PATH = '/fragments/nav/header';

function decorateBrand(section) {
  section.classList.add('header-brand');
  const link = section.querySelector('a');
  if (!link) return;
  const img = link.querySelector('img');
  if (img) img.classList.add('header-logo');
  // Hide brand text visually (keep for accessibility)
  const textNodes = [...link.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
  textNodes.forEach((n) => {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = n.textContent;
    n.replaceWith(span);
  });
}

function decorateNav(section) {
  section.classList.add('header-nav');
  const ul = section.querySelector('ul');
  if (!ul) return;
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Main navigation');
  nav.append(ul);
  const content = section.querySelector('.default-content');
  if (content) content.append(nav);
  else section.append(nav);
}

function decorateActions(section) {
  section.classList.add('header-actions');
}

function addHamburger(header) {
  const btn = document.createElement('button');
  btn.className = 'header-hamburger';
  btn.setAttribute('aria-label', 'Toggle menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  btn.addEventListener('click', () => {
    const open = header.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
  const brand = header.querySelector('.header-brand .default-content');
  if (brand) brand.append(btn);
}

export default async function init(el) {
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;
  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    fragment.classList.add('header-content');
    const sections = fragment.querySelectorAll(':scope > .section');
    if (sections[0]) decorateBrand(sections[0]);
    if (sections[1]) decorateNav(sections[1]);
    if (sections[2]) decorateActions(sections[2]);
    el.append(fragment);
    addHamburger(el);
  } catch {
    // Header fragment not available
  }
}
