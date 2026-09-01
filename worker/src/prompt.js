const CTX_DESC = {
  nl: {
    hospital: 'moderne Nederlandse ziekenhuisomgeving, professionele zorgverleners (verpleegkundige, arts, specialist)',
    care: 'zorginstelling: GGZ, VVT, huisartsenpraktijk of thuiszorg',
    education: 'school- of universitaire setting, rollen: docent, student, teamleider, ouder',
    defence: 'militaire of civiele defensieomgeving, hiërarchie en veiligheid centraal',
    business: 'kantoor- of organisatiesetting, rollen: medewerker, leidinggevende, HR, klant',
    welfare: 'maatschappelijke dienstverlening, jeugdzorg of sociale wijkteams',
    government: 'publieke sector, gemeente of uitvoeringsorganisatie',
    general: 'neutrale alledaagse setting (thuis, straat, buurt)',
  },
  en: {
    hospital: 'modern hospital environment, professional healthcare workers (nurse, doctor, specialist)',
    care: 'healthcare setting: mental health, elderly care, GP practice or home care',
    education: 'school or university setting, roles: teacher, student, team leader, parent',
    defence: 'military or civilian defence environment, hierarchy and safety central',
    business: 'office or organisational setting, roles: employee, manager, HR, client',
    welfare: 'social services, youth care or community welfare teams',
    government: 'public sector, municipality or government agency',
    general: 'neutral everyday setting (home, street, neighbourhood)',
  },
};

const CTX_IMG = {
  hospital: 'modern hospital interior, warm clinical light, professional healthcare workers, cinematic depth of field',
  care: 'care home or community health setting, warm light, compassionate caregiver, cinematic photography',
  education: 'university classroom, natural light, students and teacher in discussion, cinematic depth of field',
  defence: 'military setting, disciplined atmosphere, uniformed personnel, dramatic cinematic lighting',
  business: 'modern office, professional colleagues in discussion, natural light, cinematic depth of field',
  welfare: 'social work setting, community centre, warm empathetic atmosphere, cinematic photography',
  government: 'government office, formal professional setting, natural light, cinematic photography',
  general: 'everyday neutral setting, street or home, authentic human moment, cinematic lighting',
};

const LEVEL_DESC = {
  nl: {
    micro: 'Micro-niveau (operationeel): een directe individuele keuze; conflict tussen twee duidelijke waarden of normen; directe gevolgen en bekende betrokkenen.',
    meso: 'Meso-niveau (organisatorisch): spanning tussen persoonlijke waarden en organisatieregels, protocollen of belangen; meerdere stakeholders met tegenstrijdige belangen.',
    macro: 'Macro-niveau (systemisch): structureel conflict waarbij beleid, wetgeving, cultuur of maatschappelijke belangen elkaar kruisen; geen eenduidige uitkomst; vermijd het dilemma plat te maken met simpele regels.',
  },
  en: {
    micro: 'Micro level (operational): a direct individual choice; conflict between two clear values or norms; direct consequences and known stakeholders.',
    meso: 'Meso level (organisational): tension between personal values and organisational rules, protocols or interests; multiple stakeholders with conflicting interests.',
    macro: 'Macro level (systemic): structural conflict where policy, legislation, culture or societal interests intersect; no single right answer; avoid flattening the dilemma into simple rules.',
  },
};

const LEVEL_TIP = {
  nl: {
    micro: 'Help deelnemers de directe keuze en de twee botsende waarden scherp te benoemen.',
    meso: 'Wijs erop dat protocollen de spanning niet wegnemen; laat tegenstrijdige belangen bespreekbaar zijn.',
    macro: 'Voorkom snelle oplossingen; nodig uit om systemische belangen en lange-termijngevolgen te verkennen.',
  },
  en: {
    micro: 'Help participants name the direct choice and the two clashing values clearly.',
    meso: 'Point out that protocols do not remove the tension; make conflicting interests discussable.',
    macro: 'Avoid quick fixes; invite exploration of systemic interests and long-term consequences.',
  },
};

const VALID_CTX = new Set(Object.keys(CTX_DESC.nl));
const VALID_LEVEL = new Set(['micro', 'meso', 'macro']);
const VALID_LANG = new Set(['nl', 'en']);

export function validateGenerateInput(body) {
  const lang = body?.lang === 'en' ? 'en' : body?.lang === 'nl' ? 'nl' : null;
  const ctx = VALID_CTX.has(body?.ctx) ? body.ctx : null;
  const level = VALID_LEVEL.has(body?.level) ? body.level : null;
  const source = typeof body?.source === 'string' ? body.source.trim() : '';
  const accessCode = typeof body?.access_code === 'string' ? body.access_code.trim() : '';

  if (!lang || !ctx || !level) return { ok: false, code: 'INVALID_REQUEST' };
  if (!accessCode) return { ok: false, code: 'UNAUTHORIZED' };
  if (!source || source.length < 10) return { ok: false, code: 'SOURCE_TOO_SHORT' };

  return { ok: true, lang, ctx, level, source, accessCode };
}

export function buildPrompt({ lang, ctx, level, source }) {
  const levelDesc = LEVEL_DESC[lang][level];
  const tipGuide = LEVEL_TIP[lang][level];

  if (lang === 'nl') {
    return `Je bent expert in het schrijven van gesprekskaarten voor moreel beraad (Stamkaart v2.0).

Schrijf een gesprekskaart op basis van onderstaande casus. Regels:
- Max 150 woorden (verhaal, exclusief titel en afsluitvraag)
- Herkenbare situatie → moreel dilemma
- Toon: empathisch, prikkelnd, uitnodigend
- Sluit af met PRECIES één krachtige open vraag
- Schrijftaal: Nederlands
- Setting: ${CTX_DESC.nl[ctx]}
- Complexiteitsniveau: ${levelDesc}
- Noem 2–4 relevante waarden (één woord of korte term per waarde)
- Geef één korte begeleiderstip (max 25 woorden) voor degene die het gesprek faciliteert; richtlijn: ${tipGuide}

Geef UITSLUITEND geldig JSON, geen markdown:
{"title":"max 8 woorden","story":"max 150 woorden","closing_question":"één open vraag","values":["waarde1","waarde2"],"facilitator_tip":"korte tip","image_prompt":"English cinematic photo prompt, no text, ${CTX_IMG[ctx]}, focus on emotion"}

CASUS:
${source}`;
  }

  return `You are an expert in writing conversation cards for moral deliberation (conversation card v2.0).

Write a conversation card based on the case below. Rules:
- Max 150 words (story only)
- Recognisable situation leading to a moral dilemma
- Tone: empathetic, thought-provoking
- End with EXACTLY one powerful open question
- Language: English
- Setting: ${CTX_DESC.en[ctx]}
- Complexity level: ${levelDesc}
- Name 2–4 relevant values (one word or short term each)
- Give one short facilitator tip (max 25 words) for whoever leads the conversation; guidance: ${tipGuide}

Respond ONLY with valid JSON, no markdown:
{"title":"max 8 words","story":"max 150 words","closing_question":"one open question","values":["value1","value2"],"facilitator_tip":"short tip","image_prompt":"English cinematic photo prompt, no text, ${CTX_IMG[ctx]}, focus on emotion"}

CASE:
${source}`;
}

export function parseCardResponse(raw) {
  const cleaned = String(raw || '').replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('INVALID_RESPONSE');
  }
}

export function validateCard(card) {
  if (!card || typeof card !== 'object') return false;
  if (!card.title || !card.story || !card.closing_question) return false;
  if (!Array.isArray(card.values) || card.values.length < 1) return false;
  return true;
}
