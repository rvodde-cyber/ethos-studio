/* Ethos Studio — shared helpers */
const ETHOS_LEVEL_STARS = { micro: 1, meso: 2, macro: 3 };
const ETHOS_MAX_SOURCE = (window.ETHOS_CONFIG && window.ETHOS_CONFIG.maxSourceLength) || 500;
const ETHOS_API_URL = (window.ETHOS_CONFIG && window.ETHOS_CONFIG.apiUrl) || '';

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
  document.querySelectorAll('.level-btn[data-level]').forEach((btn) => {
    const stars = btn.querySelector('.level-btn-stars');
    if (stars) stars.textContent = ethosLevelStars(btn.dataset.level);
  });
}

function ethosGetAccessCode() {
  try {
    const remember = localStorage.getItem('ethos_remember_code') !== '0';
    if (remember) {
      return localStorage.getItem('ethos_access_code') || sessionStorage.getItem('ethos_access_code') || '';
    }
    return sessionStorage.getItem('ethos_access_code') || '';
  } catch (e) {
    return '';
  }
}

function ethosSaveAccessCode(code, remember) {
  try {
    sessionStorage.setItem('ethos_access_code', code);
    localStorage.setItem('ethos_remember_code', remember ? '1' : '0');
    if (remember) localStorage.setItem('ethos_access_code', code);
    else localStorage.removeItem('ethos_access_code');
  } catch (e) {}
}

function ethosSaveRememberCodePref(remember) {
  try {
    localStorage.setItem('ethos_remember_code', remember ? '1' : '0');
    if (!remember) localStorage.removeItem('ethos_access_code');
    else {
      const code = sessionStorage.getItem('ethos_access_code');
      if (code) localStorage.setItem('ethos_access_code', code);
    }
  } catch (e) {}
}

const ETHOS_API_ERRORS = {
  nl: {
    UNAUTHORIZED: 'De toegangscode is onjuist. Controleer de code en probeer opnieuw.',
    SOURCE_TOO_LONG: 'De situatie is te lang. Gebruik maximaal 500 tekens.',
    SOURCE_TOO_SHORT: 'Beschrijf de situatie in minimaal een paar zinnen.',
    RATE_LIMIT_HOURLY: 'Je hebt het uurlimiet bereikt (10 kaarten per uur). Probeer het later opnieuw.',
    RATE_LIMIT_DAILY: 'Ethos Studio heeft het daglimiet bereikt. Morgen kun je weer nieuwe kaarten maken.',
    INVALID_REQUEST: 'Ongeldige aanvraag. Controleer je invoer.',
    UPSTREAM_ERROR: 'De kaartgenerator is tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.',
    INVALID_RESPONSE: 'De gegenereerde kaart was ongeldig. Probeer het opnieuw.',
    ORIGIN_FORBIDDEN: 'Deze site is nog niet gekoppeld aan de API. Neem contact op met de beheerder.',
    NETWORK: 'Verbinding mislukt. Controleer je internet en probeer opnieuw.',
    NO_API_URL: 'API-URL niet geconfigureerd. Zie worker/README.md.',
    NO_ACCESS_CODE: 'Voer eerst je toegangscode in.',
  },
  en: {
    UNAUTHORIZED: 'The access code is incorrect. Check the code and try again.',
    SOURCE_TOO_LONG: 'The situation text is too long. Use at most 500 characters.',
    SOURCE_TOO_SHORT: 'Describe the situation in at least a few sentences.',
    RATE_LIMIT_HOURLY: 'You have reached the hourly limit (10 cards per hour). Please try again later.',
    RATE_LIMIT_DAILY: 'Ethos Studio has reached its daily limit. You can create new cards again tomorrow.',
    INVALID_REQUEST: 'Invalid request. Check your input.',
    UPSTREAM_ERROR: 'The card generator is temporarily unavailable. Please try again in a few minutes.',
    INVALID_RESPONSE: 'The generated card was invalid. Please try again.',
    ORIGIN_FORBIDDEN: 'This site is not yet linked to the API. Contact the administrator.',
    NETWORK: 'Connection failed. Check your internet and try again.',
    NO_API_URL: 'API URL not configured. See worker/README.md.',
    NO_ACCESS_CODE: 'Please enter your access code first.',
  },
};

function ethosApiErrorMessage(code, lang) {
  const table = ETHOS_API_ERRORS[lang] || ETHOS_API_ERRORS.nl;
  return table[code] || table.UPSTREAM_ERROR;
}

async function ethosGenerateCard({ accessCode, lang, ctx, level, source }) {
  if (!ETHOS_API_URL) {
    const err = new Error(ethosApiErrorMessage('NO_API_URL', lang));
    err.code = 'NO_API_URL';
    throw err;
  }
  if (!accessCode) {
    const err = new Error(ethosApiErrorMessage('NO_ACCESS_CODE', lang));
    err.code = 'NO_ACCESS_CODE';
    throw err;
  }

  let res;
  try {
    res = await fetch(ETHOS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_code: accessCode,
        lang,
        ctx,
        level,
        source,
      }),
    });
  } catch (e) {
    const err = new Error(ethosApiErrorMessage('NETWORK', lang));
    err.code = 'NETWORK';
    throw err;
  }

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    const err = new Error(ethosApiErrorMessage('UPSTREAM_ERROR', lang));
    err.code = 'UPSTREAM_ERROR';
    throw err;
  }

  if (!res.ok || data.error) {
    const err = new Error(data.message || ethosApiErrorMessage(data.code, lang));
    err.code = data.code || 'UPSTREAM_ERROR';
    throw err;
  }

  return data.card;
}

function ethosRegisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  });
}

ethosRegisterServiceWorker();
