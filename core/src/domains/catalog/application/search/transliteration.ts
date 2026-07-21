import { escapeRegExp } from '../../../../utils/stringUtils';

const TELUGU_TRANSLITERATION_MAP: Array<[RegExp, string]> = [
    [/గు/g, 'gu'],
    [/మ్మ/g, 'mma'],
    [/డి/g, 'di'],
    [/ధి/g, 'dhi'],
    [/శా/g, 'sha'],
    [/సా/g, 'sa'],
    [/ం/g, 'm'],
    [/ా/g, 'a'],
    [/ి/g, 'i'],
    [/ీ/g, 'i'],
    [/ు/g, 'u'],
    [/ూ/g, 'u'],
    [/ె/g, 'e'],
    [/ే/g, 'e'],
    [/ై/g, 'ai'],
    [/ొ/g, 'o'],
    [/ో/g, 'o'],
    [/ౌ/g, 'au'],
    [/క/g, 'ka'],
    [/గ/g, 'ga'],
    [/చ/g, 'cha'],
    [/జ/g, 'ja'],
    [/ట/g, 'ta'],
    [/డ/g, 'da'],
    [/త/g, 'ta'],
    [/ద/g, 'da'],
    [/న/g, 'na'],
    [/ప/g, 'pa'],
    [/బ/g, 'ba'],
    [/మ/g, 'ma'],
    [/య/g, 'ya'],
    [/ర/g, 'ra'],
    [/ల/g, 'la'],
    [/వ/g, 'va'],
    [/శ/g, 'sha'],
    [/స/g, 'sa'],
    [/హ/g, 'ha'],
];

const compact = (value: string): string => value.replace(/[^a-z0-9]+/g, '');

export function normalizeCatalogSearchText(value: unknown): string {
    if (typeof value !== 'string') return '';
    let text = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (const [pattern, replacement] of TELUGU_TRANSLITERATION_MAP) {
        text = text.replace(pattern, replacement);
    }
    return text
        .replace(/[^a-z0-9\s-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function getTransliterationConfidence(search: string, candidate: string): number {
    const normalizedSearch = normalizeCatalogSearchText(search);
    const normalizedCandidate = normalizeCatalogSearchText(candidate);
    if (!normalizedSearch || !normalizedCandidate) return 0;
    if (normalizedSearch === normalizedCandidate) return 1;
    const searchCompact = compact(normalizedSearch);
    const candidateCompact = compact(normalizedCandidate);
    if (!searchCompact || !candidateCompact) return 0;
    if (searchCompact === candidateCompact) return 0.92;
    if (candidateCompact.startsWith(searchCompact) || searchCompact.startsWith(candidateCompact)) return 0.78;
    if (candidateCompact.includes(searchCompact) || searchCompact.includes(candidateCompact)) return 0.62;
    return 0;
}

export function isSuspiciousQueryPattern(search: string): boolean {
    const normalized = normalizeCatalogSearchText(search);
    if (!normalized) return false;
    const compacted = compact(normalized);
    if (compacted.length > 48) return true;
    if (/([a-z0-9])\1{5,}/.test(compacted)) return true;
    if (normalized.split(' ').length > 10) return true;
    if (/free|casino|betting|escort|whatsapp|wa me/.test(normalized)) return true;
    return false;
}

export { TELUGU_TRANSLITERATION_MAP, compact, escapeRegExp };
