// Countries for the Solivé order form, plus helpers to guess the country from a free-text address.
// Shared by the website (src/lib/countries.js re-exports this) and the order API.

export const COUNTRY_CODES = ('AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW').split(' ');

// Where 5 L bottles can be delivered: Europe and the USA.
// Edit this list to change the serviceable area (Russia and Belarus included as European; Turkey and the Caucasus excluded).
export const EUROPE = new Set(('AD AL AT BA BE BG BY CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SK SM UA VA XK').split(' '));
export const FIVE_L_SERVICEABLE = code => code === 'US' || EUROPE.has(code);

const NAMES_EN = {
  XK: 'Kosovo',
};
const LOCALES = ['en', 'it', 'es', 'fr', 'pt', 'cs', 'ru', 'de', 'nl', 'pl'];

// Extra spellings people commonly type
const ALIASES = {
  US: ['usa', 'u s a', 'u s', 'us', 'united states of america', 'america', 'stati uniti', 'estados unidos', 'etats unis', 'сша', 'соединенные штаты'],
  GB: ['uk', 'u k', 'united kingdom', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland', 'regno unito', 'reino unido', 'royaume uni', 'великобритания', 'англия'],
  NL: ['holland', 'the netherlands'],
  CZ: ['czech republic', 'czechia', 'cesko', 'ceska republika'],
  DE: ['deutschland', 'germania', 'alemania', 'allemagne'],
  CH: ['schweiz', 'suisse', 'svizzera', 'swiss'],
  AT: ['osterreich'],
  AE: ['uae', 'u a e', 'emirates', 'dubai', 'abu dhabi'],
  RU: ['russian federation', 'рф', 'россия'],
  KR: ['south korea', 'korea'],
  VA: ['vatican', 'vatican city', 'holy see'],
  HK: ['hong kong'],
  IN: ['bharat'],
  // Older or English names that Intl no longer returns
  TR: ['turkey', 'turkei', 'turchia', 'turquia', 'turquie', 'turecko', 'турция', 'republic of turkey'],
  CI: ['ivory coast'],
  CV: ['cape verde'],
  MK: ['macedonia'],
  SZ: ['swaziland'],
  MM: ['burma'],
  TL: ['east timor'],
  CD: ['drc', 'dr congo', 'democratic republic of congo'],
  CG: ['republic of congo'],
  PS: ['palestine'],
  KP: ['north korea'],
  VN: ['viet nam'],
  LA: ['laos'],
  IR: ['persia'],
};

// Well-known cities, used only when the address names no country.
// Local spellings included. Ambiguous everyday words (e.g. "Nice", "Split") only count as a whole address part.
const CITIES = {
  IT: 'rome roma milan milano naples napoli turin torino florence firenze venice venezia bologna genoa genova palermo verona perugia orvieto terni assisi siena pisa bari catania trieste padua padova bergamo brescia como lucca spoleto todi gubbio allerona',
  GB: 'london manchester birmingham liverpool edinburgh glasgow leeds bristol oxford cambridge cardiff belfast brighton newcastle sheffield nottingham leicester southampton aberdeen york',
  FR: 'paris lyon marseille toulouse bordeaux lille nantes strasbourg montpellier cannes rennes reims antibes',
  DE: 'berlin munich munchen muenchen hamburg frankfurt cologne koln koeln dusseldorf duesseldorf stuttgart dresden leipzig hannover hanover nuremberg nurnberg nuernberg bonn heidelberg',
  ES: 'madrid barcelona valencia seville sevilla malaga bilbao zaragoza marbella ibiza granada alicante',
  PT: 'lisbon lisboa porto oporto faro coimbra',
  NL: 'amsterdam rotterdam utrecht eindhoven haarlem|the hague|den haag',
  BE: 'brussels bruxelles brussel antwerp antwerpen ghent gent bruges brugge',
  CH: 'zurich zuerich geneva geneve genf basel bern berne lausanne lugano lucerne luzern',
  AT: 'vienna wien salzburg innsbruck graz linz',
  IE: 'dublin galway limerick',
  DK: 'copenhagen kobenhavn aarhus odense',
  SE: 'stockholm gothenburg goteborg malmo uppsala',
  NO: 'oslo bergen stavanger trondheim',
  FI: 'helsinki espoo tampere turku',
  PL: 'warsaw warszawa krakow cracow gdansk wroclaw poznan lodz',
  CZ: 'prague praha brno ostrava plzen',
  HU: 'budapest debrecen',
  GR: 'athens athina thessaloniki heraklion',
  RO: 'bucharest bucuresti timisoara|cluj napoca',
  BG: 'sofia plovdiv varna',
  HR: 'zagreb dubrovnik zadar rijeka',
  SI: 'ljubljana',
  SK: 'bratislava kosice',
  MT: 'valletta sliema',
  MC: 'monaco|monte carlo',
  RU: 'moscow moskva москва|saint petersburg|st petersburg|санкт петербург',
  UA: 'kyiv kiev lviv odesa odessa',
  US: 'nyc boston chicago miami seattle houston dallas austin philadelphia atlanta denver phoenix|new york|new york city|los angeles|san francisco|san diego|las vegas|washington dc',
  CA: 'toronto montreal vancouver ottawa calgary edmonton',
  AU: 'sydney melbourne brisbane perth adelaide canberra',
  NZ: 'auckland wellington christchurch',
  IN: 'mumbai bombay delhi bengaluru bangalore kolkata calcutta chennai madras hyderabad pune ahmedabad jaipur gurgaon gurugram noida chandigarh lucknow kochi|new delhi',
  AE: 'sharjah ajman',
  TR: 'istanbul ankara izmir antalya bodrum',
  JP: 'tokyo osaka kyoto yokohama',
  CN: 'beijing shanghai shenzhen guangzhou',
  BR: 'brasilia|sao paulo|rio de janeiro',
  MX: 'cdmx guadalajara monterrey|mexico city',
  ZA: 'johannesburg durban pretoria|cape town',
  IL: 'jerusalem haifa|tel aviv',
  SA: 'riyadh jeddah',
  QA: 'doha',
  KR: 'seoul busan',
  TH: 'bangkok phuket',
  SG: 'singapore',
};
const WHOLE_ONLY = { nice: 'FR', split: 'HR', zug: 'CH', bath: 'GB', reading: 'GB' };

let cityLookup;
function buildCities() {
  const map = new Map();
  for (const [code, str] of Object.entries(CITIES)) {
    // first part: one-word cities separated by spaces; after each '|': one multi-word city
    str.split('|').forEach((group, i) => {
      if (i === 0) group.trim().split(/\s+/).forEach(w => map.set(norm(w), code));
      else map.set(norm(group), code);
    });
  }
  return map;
}

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.'’]/g, '').replace(/[^a-z0-9Ѐ-ӿ]+/g, ' ').trim();

let lookup;
function buildLookup() {
  const map = new Map();
  const add = (name, code) => { const k = norm(name); if (k && !map.has(k)) map.set(k, code); };
  for (const code of COUNTRY_CODES) {
    for (const loc of LOCALES) {
      try { add(new Intl.DisplayNames([loc], { type: 'region' }).of(code), code); } catch { /* older runtimes */ }
    }
    if (NAMES_EN[code]) add(NAMES_EN[code], code);
  }
  for (const [code, list] of Object.entries(ALIASES)) list.forEach(n => map.set(norm(n), code));
  return map;
}

const US_STATES = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '));

/** Best guess of the ISO country code from a typed address, or '' if unsure. */
export function guessCountry(address) {
  const raw = String(address || '');
  if (!raw.trim()) return '';
  lookup = lookup || buildLookup();
  const parts = raw.split(/[,\n;]/).map(p => p.trim()).filter(Boolean);
  // Look at the end of the address first, where the country usually is
  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = norm(parts[i]);
    if (lookup.has(seg)) return lookup.get(seg);
    // country name inside a longer segment, e.g. "10115 Berlin Germany"
    const words = seg.split(' ');
    for (let len = Math.min(5, words.length); len >= 1; len--) {
      for (let s = words.length - len; s >= 0; s--) {
        const phrase = words.slice(s, s + len).join(' ');
        if (phrase.length < 4 && !['usa', 'uk', 'us', 'uae', 'рф'].includes(phrase)) continue;
        if (lookup.has(phrase)) return lookup.get(phrase);
      }
    }
  }
  // US style "City, ST 12345"
  if (/\b([A-Z]{2})\s+\d{5}(-\d{4})?\b/.test(raw) && US_STATES.has(RegExp.$1)) return 'US';
  // UK postcode, e.g. "SW1A 2AA"
  if (/\b[A-Z]{1,2}\d[A-Z\d]?\s+\d[A-Z]{2}\b/.test(raw.toUpperCase())) return 'GB';
  // No country written: try a well-known city, again from the end
  cityLookup = cityLookup || buildCities();
  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = norm(parts[i]);
    if (WHOLE_ONLY[seg]) return WHOLE_ONLY[seg];
    const words = seg.split(' ');
    for (let len = Math.min(4, words.length); len >= 1; len--) {
      for (let s = words.length - len; s >= 0; s--) {
        const phrase = words.slice(s, s + len).join(' ');
        if (cityLookup.has(phrase)) return cityLookup.get(phrase);
      }
    }
  }
  return '';
}

export function countryName(code, lang = 'en') {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || NAMES_EN[code] || code; } catch { return NAMES_EN[code] || code; }
}
