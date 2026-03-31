export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  if (rows.length < 2) {
    block.classList.add('no-image');
    return;
  }

  // Last row is the authorable image
  const imageRow = rows[rows.length - 1];
  const img = imageRow.querySelector('img');

  if (img) {
    imageRow.classList.add('hero-image');
    // Wrap plain <img> in <picture> for EDS compatibility
    if (!img.closest('picture')) {
      const pic = document.createElement('picture');
      img.before(pic);
      pic.appendChild(img);
    }
  } else {
    block.classList.add('no-image');
  }
}
