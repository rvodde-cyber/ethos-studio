import { buildPrompt, parseCardResponse, validateCard, validateGenerateInput } from './prompt.js';

const MESSAGES = {
  nl: {
    UNAUTHORIZED: 'De toegangscode is onjuist. Vraag een geldige code aan de beheerder.',
    SOURCE_TOO_LONG: 'De situatie is te lang. Gebruik maximaal 500 tekens.',
    SOURCE_TOO_SHORT: 'Beschrijf de situatie in minimaal een paar zinnen.',
    RATE_LIMIT_HOURLY: 'Je hebt het uurlimiet bereikt (10 kaarten per uur). Probeer het later opnieuw.',
    RATE_LIMIT_DAILY: 'Ethos Studio heeft het daglimiet bereikt. Morgen kun je weer nieuwe kaarten maken.',
    INVALID_REQUEST: 'Ongeldige aanvraag. Controleer je invoer en probeer opnieuw.',
    UPSTREAM_ERROR: 'De kaartgenerator is tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.',
    INVALID_RESPONSE: 'De gegenereerde kaart was ongeldig. Probeer het opnieuw.',
    METHOD_NOT_ALLOWED: 'Alleen POST is toegestaan.',
    ORIGIN_FORBIDDEN: 'Dit verzoek is niet toegestaan vanaf deze website.',
  },
  en: {
    UNAUTHORIZED: 'The access code is incorrect. Ask the administrator for a valid code.',
    SOURCE_TOO_LONG: 'The situation text is too long. Use at most 500 characters.',
    SOURCE_TOO_SHORT: 'Describe the situation in at least a few sentences.',
    RATE_LIMIT_HOURLY: 'You have reached the hourly limit (10 cards per hour). Please try again later.',
    RATE_LIMIT_DAILY: 'Ethos Studio has reached its daily limit. You can create new cards again tomorrow.',
    INVALID_REQUEST: 'Invalid request. Check your input and try again.',
    UPSTREAM_ERROR: 'The card generator is temporarily unavailable. Please try again in a few minutes.',
    INVALID_RESPONSE: 'The generated card was invalid. Please try again.',
    METHOD_NOT_ALLOWED: 'Only POST is allowed.',
    ORIGIN_FORBIDDEN: 'This request is not allowed from this website.',
  },
};

function msg(lang, code) {
  return (MESSAGES[lang] || MESSAGES.nl)[code] || MESSAGES.nl.UPSTREAM_ERROR;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function errorResponse(lang, code, status, headers = {}) {
  return json({ error: true, code, message: msg(lang, code) }, status, headers);
}

function getAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = getAllowedOrigins(env);
  const match = allowed.find((o) => o === origin);
  if (!match) return null;
  return {
    'Access-Control-Allow-Origin': match,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

async function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

async function hashKey(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

function hourBucket() {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}`;
}

function dayBucket() {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function getCount(kv, key) {
  const raw = await kv.get(key);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

async function incrementCount(kv, key, ttlSeconds) {
  const count = (await getCount(kv, key)) + 1;
  await kv.put(key, String(count), { expirationTtl: ttlSeconds });
  return count;
}

async function checkRateLimits(env, ip, accessCode) {
  const hourlyLimit = parseInt(env.HOURLY_LIMIT || '10', 10);
  const dailyLimit = parseInt(env.DAILY_LIMIT || '300', 10);
  const ipHash = await hashKey(ip || 'unknown');
  const codeHash = await hashKey(accessCode);
  const hourKey = `h:${ipHash}:${codeHash}:${hourBucket()}`;
  const dayKey = `d:global:${dayBucket()}`;

  const hourlyCount = await getCount(env.RATE_LIMIT, hourKey);
  if (hourlyCount >= hourlyLimit) return 'RATE_LIMIT_HOURLY';

  const dailyCount = await getCount(env.RATE_LIMIT, dayKey);
  if (dailyCount >= dailyLimit) return 'RATE_LIMIT_DAILY';

  return null;
}

async function recordUsage(env, ip, accessCode) {
  const ipHash = await hashKey(ip || 'unknown');
  const codeHash = await hashKey(accessCode);
  const hourKey = `h:${ipHash}:${codeHash}:${hourBucket()}`;
  const dayKey = `d:global:${dayBucket()}`;
  await incrementCount(env.RATE_LIMIT, hourKey, 7200);
  await incrementCount(env.RATE_LIMIT, dayKey, 172800);
}

async function callAnthropic(env, prompt, retry = false) {
  const userContent = retry
    ? `${prompt}\n\nReturn ONLY one valid JSON object. No markdown, no commentary.`
    : prompt;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Anthropic error', res.status, data);
    throw new Error('UPSTREAM_ERROR');
  }

  return (data.content || []).map((part) => part.text || '').join('');
}

async function generateCard(env, input) {
  const prompt = buildPrompt(input);
  let raw;
  try {
    raw = await callAnthropic(env, prompt, false);
  } catch (e) {
    throw new Error('UPSTREAM_ERROR');
  }

  let card;
  try {
    card = parseCardResponse(raw);
  } catch (e) {
    try {
      raw = await callAnthropic(env, prompt, true);
      card = parseCardResponse(raw);
    } catch (err) {
      throw new Error('INVALID_RESPONSE');
    }
  }

  if (!validateCard(card)) throw new Error('INVALID_RESPONSE');
  return card;
}

async function handleGenerate(request, env) {
  const cors = corsHeaders(request, env);
  if (!cors) return errorResponse('nl', 'ORIGIN_FORBIDDEN', 403);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return errorResponse('nl', 'INVALID_REQUEST', 400, cors);
  }

  const lang = body?.lang === 'en' ? 'en' : 'nl';
  const maxLen = parseInt(env.MAX_SOURCE_LENGTH || '500', 10);
  const source = typeof body?.source === 'string' ? body.source.trim() : '';

  if (source.length > maxLen) {
    return errorResponse(lang, 'SOURCE_TOO_LONG', 400, cors);
  }

  const validated = validateGenerateInput(body);
  if (!validated.ok) {
    const code = validated.code === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'INVALID_REQUEST';
    const status = code === 'UNAUTHORIZED' ? 401 : 400;
    return errorResponse(lang, code, status, cors);
  }

  const accessOk = await timingSafeEqual(validated.accessCode, env.ACCESS_CODE || '');
  if (!accessOk) return errorResponse(lang, 'UNAUTHORIZED', 401, cors);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateError = await checkRateLimits(env, ip, validated.accessCode);
  if (rateError) return errorResponse(lang, rateError, 429, cors);

  let card;
  try {
    card = await generateCard(env, validated);
  } catch (e) {
    const code = e.message === 'INVALID_RESPONSE' ? 'INVALID_RESPONSE' : 'UPSTREAM_ERROR';
    return errorResponse(lang, code, 502, cors);
  }

  await recordUsage(env, ip, validated.accessCode);
  return json({ card }, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      if (!cors) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/api/generate-card' || url.pathname.endsWith('/api/generate-card')) {
      if (request.method !== 'POST') {
        const lang = 'nl';
        return errorResponse(lang, 'METHOD_NOT_ALLOWED', 405, cors || {});
      }
      return handleGenerate(request, env);
    }

    if (url.pathname === '/health') {
      return json({ ok: true }, 200, cors || {});
    }

    return new Response('Not found', { status: 404 });
  },
};
