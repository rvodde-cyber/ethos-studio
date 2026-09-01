/* Ethos Studio — shared helpers */
const ETHOS_LEVEL_STARS = { micro: 1, meso: 2, macro: 3 };

function ethosLevelStars(level) {
  const n = ETHOS_LEVEL_STARS[level] || 2;
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

function ethosLevelBadgeHTML(level, label) {
  return `<span class="level-badge-label">${label}</span><span class="level-stars" aria-hidden="true">${ethosLevelStars(level)}</span>`;
}

function ethosApplyLevelBadge(el, level, label) {
  if (!el) return;
  el.dataset.level = level;
  el.className = 'level-badge level-tag';
  el.innerHTML = ethosLevelBadgeHTML(level, label);
}

function ethosUpdateLevelButtons() {
  document.querySelectorAll('.level-btn[data-level]').forEach(btn => {
    const stars = btn.querySelector('.level-btn-stars');
    if (stars) stars.textContent = ethosLevelStars(btn.dataset.level);
  });
}

function ethosRegisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  });
}

ethosRegisterServiceWorker();
