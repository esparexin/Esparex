const MIN_REPEAT_UNIT_LENGTH = 12;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const collapseRepeatedParagraph = (paragraph: string): string => {
  const normalized = normalizeWhitespace(paragraph);
  if (!normalized) return "";

  for (let unitLength = MIN_REPEAT_UNIT_LENGTH; unitLength <= Math.floor(normalized.length / 2); unitLength += 1) {
    if (normalized.length % unitLength !== 0) continue;

    const repeatCount = normalized.length / unitLength;
    if (repeatCount < 2) continue;

    const candidate = normalized.slice(0, unitLength).trim();
    if (candidate.length < MIN_REPEAT_UNIT_LENGTH) continue;
    if (candidate.repeat(repeatCount) === normalized) {
      return candidate;
    }
  }

  return paragraph.trim();
};

export function cleanupListingDescription(description: string): string {
  const fallback = description.trim();
  if (!fallback) return "";

  const dedupedParagraphs: string[] = [];

  for (const rawParagraph of description.split(/\n{2,}/)) {
    const paragraph = collapseRepeatedParagraph(rawParagraph);
    if (!paragraph) continue;

    const previous = dedupedParagraphs[dedupedParagraphs.length - 1];
    if (previous && normalizeWhitespace(previous) === normalizeWhitespace(paragraph)) {
      continue;
    }

    dedupedParagraphs.push(paragraph);
  }

  return dedupedParagraphs.length > 0 ? dedupedParagraphs.join("\n\n") : fallback;
}
