export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content';

  const tabList = document.createElement('div');
  tabList.className = 'tab-list';
  tabList.setAttribute('role', 'tablist');

  rows.forEach((row, idx) => {
    const cols = [...row.querySelectorAll(':scope > div')];
    const imageCol = cols[0];
    const textCol = cols[1];

    // Tab panel - shows the image
    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.id = `content-tab-panel-${idx}`;
    if (idx === 0) panel.classList.add('is-active');
    if (imageCol) panel.append(imageCol);
    tabContent.append(panel);

    // Tab button - shows the text (h3 + description)
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.className = 'tab-button';
    btn.setAttribute('aria-controls', `content-tab-panel-${idx}`);
    if (idx === 0) btn.classList.add('is-active');
    if (textCol) btn.append(textCol);

    btn.addEventListener('click', () => {
      block.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('is-active'));
      block.querySelectorAll('.tab-button').forEach((b) => b.classList.remove('is-active'));
      panel.classList.add('is-active');
      btn.classList.add('is-active');
    });

    tabList.append(btn);
    row.remove();
  });

  block.textContent = '';
  block.append(tabContent, tabList);
}
