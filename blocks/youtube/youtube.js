import observe from '../../scripts/utils/observer.js';

function decorate(el) {
  el.innerHTML = `<iframe src="${el.dataset.src}" class="youtube"
  webkitallowfullscreen mozallowfullscreen allowfullscreen
  allow="encrypted-media; accelerometer; gyroscope; picture-in-picture"
  scrolling="no"
  title="Youtube Video">`;
}

export default function init(block) {
  const a = block.querySelector('a[href]');
  if (!a) return;

  const url = new URL(a.href);
  const div = document.createElement('div');
  div.className = 'video';
  const params = new URLSearchParams(url.search);
  const id = params.get('v') || url.pathname.split('/').pop();
  params.append('rel', '0');
  params.delete('v');
  div.dataset.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
  block.textContent = '';
  block.append(div);
  observe(div, decorate);
}
