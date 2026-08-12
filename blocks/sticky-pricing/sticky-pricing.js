/**
 * Sticky pricing bar — fixed to bottom of viewport, visible after user
 * scrolls past the cards-pricing section.
 */
export default function decorate(block) {
  // Build pills from authored rows: each row = [name, price, link]
  const rows = [...block.children];
  const pills = rows.map((row) => {
    const cells = [...row.children];
    const name = cells[0]?.textContent.trim() || '';
    const price = cells[1]?.textContent.trim() || '';
    const anchor = cells[2]?.querySelector('a');

    const pill = document.createElement('div');
    pill.className = 'sticky-pricing-pill';
    pill.innerHTML = `
      <span class="sticky-pricing-name">${name}</span>
      <span class="sticky-pricing-price">${price}</span>
      ${anchor ? `<a class="sticky-pricing-cta" href="${anchor.href}">${anchor.textContent.trim()}</a>` : ''}
    `;
    return pill;
  });

  block.textContent = '';
  pills.forEach((p) => block.append(p));

  // Show bar once user scrolls past the pricing cards section
  const pricingSection = document.querySelector('.cards-pricing');
  if (!pricingSection) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      block.closest('.sticky-pricing-container')?.classList.toggle('is-visible', !entry.isIntersecting);
    },
    { threshold: 0 },
  );
  observer.observe(pricingSection);
}
