import { Poet } from '../types.js';

/**
 * Normalizes Urdu text for fast and resilient search matching:
 * - Strips all Urdu/Arabic diacritics (zabar, zer, pesh, jazm, tashdeed, khari zabar, etc.)
 * - Normalizes letter variants (alif with madda, hamza, yeh, tehs, waw)
 */
export function normalizeUrduText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u0640\u0653\u0654\u0655]/g, '') // remove diacritics and tatweel
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ىيے]/g, 'ی')
    .replace(/[ةۂۃ]/g, 'ہ')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Normalizes English and Roman Urdu text:
 * - Lowercases and trims
 * - Replaces hyphens, apostrophes, and dots with spaces
 * - Normalizes multiple spaces
 */
export function normalizeEnglishText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/['’`\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common phonetic transliteration aliases for Urdu poets
 */
const ROMAN_ALIASES: Record<string, string> = {
  ahmed: 'ahmad',
  meer: 'mir',
  jon: 'jaun',
  john: 'jaun',
  eliya: 'elia',
  ilya: 'elia',
  parvin: 'parveen',
  perveen: 'parveen',
  saagar: 'saghar',
  saghir: 'saghar',
  muneer: 'munir',
  saahir: 'sahir',
  wasim: 'waseem',
  amir: 'ameer',
  ubaidullah: 'obaidullah',
  khawaja: 'khwaja',
  daagh: 'dagh',
  katil: 'qateel',
  faize: 'faiz',
  allama: 'iqbal',
};

/**
 * Checks whether a poet matches a search query in either Urdu or English/Roman.
 * Supports:
 * - Direct Urdu substring (e.g. 'احمد فراز')
 * - Direct English/Roman substring (e.g. 'Ahmad Faraz', 'Allama Iqbal', 'Mir Taqi Mir')
 * - Variant phonetic spellings (e.g. 'ahmed faraz', 'meer taqi meer', 'jon elia')
 * - Token matching (e.g. 'faraz', 'iqbal', 'mir', 'ghalib')
 */
export function matchPoetBilingual(poet: Poet, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;
  const q = rawQuery.trim();

  // Check 1: Urdu match
  const qUrdu = normalizeUrduText(q);
  const poetUrduNorm = normalizeUrduText(poet.nameUrdu);
  if (poetUrduNorm.includes(qUrdu)) return true;
  if (poet.titleOrEra && normalizeUrduText(poet.titleOrEra).includes(qUrdu)) return true;

  // Check 2: English match
  const qEn = normalizeEnglishText(q);
  const poetEnNorm = normalizeEnglishText(poet.nameEnglish || '');
  if (poetEnNorm.includes(qEn)) return true;

  // Check 3: Phonetic/Alias match
  const words = qEn.split(' ').filter(Boolean);
  const replacedWords = words.map((w) => ROMAN_ALIASES[w] || w).join(' ');
  if (poetEnNorm.includes(replacedWords)) return true;

  // Check 4: Individual token match (e.g. 'iqbal' matches 'Allama Iqbal', 'faraz' matches 'Ahmad Faraz')
  const poetEnTokens = poetEnNorm.split(' ').filter(Boolean);
  if (
    words.length > 0 &&
    words.every((w) => {
      const canonical = ROMAN_ALIASES[w] || w;
      return poetEnTokens.some((t) => t === canonical || t.startsWith(canonical) || t.includes(canonical));
    })
  ) {
    return true;
  }

  return false;
}
