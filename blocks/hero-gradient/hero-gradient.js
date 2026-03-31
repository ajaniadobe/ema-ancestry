export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  if (rows.length < 2) {
    block.classList.add('no-image');
    return;
  }

  // Last row is the authorable image
  const imageRow = rows[rows.length - 1];
  const img = imageRow.querySelector('img');

  if (!img) {
    block.classList.add('no-image');
    return;
  }

  // Wrap plain <img> in <picture> for EDS compatibility
  if (!img.closest('picture')) {
    const pic = document.createElement('picture');
    img.before(pic);
    pic.appendChild(img);
  }

  const isBehind = block.classList.contains('behind');

  if (isBehind) {
    // Create background layer with the image
    const bg = document.createElement('div');
    bg.className = 'hero-background';
    bg.append(img.closest('picture') || img);
    block.prepend(bg);
    imageRow.remove();

    // Wrap remaining text rows in foreground
    const fg = document.createElement('div');
    fg.className = 'hero-foreground';
    [...block.querySelectorAll(':scope > div:not(.hero-background)')].forEach((r) => fg.append(r));
    block.append(fg);
  } else {
    // Both 'below' (default) and 'right' — mark the image row
    imageRow.classList.add('hero-image');
  }
}
