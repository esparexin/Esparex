/**
 * Sanitizes an upload filename to prevent path traversal (`..`), path separators (`/`, `\`),
 * and control characters, while preserving valid file extension and Unicode characters.
 */
export const sanitizeFileName = (filename: string): string => {
  if (typeof filename !== "string" || !filename.trim()) return "unnamed-file";

  const lastDotIndex = filename.lastIndexOf(".");
  let name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";

  name = name
    .replace(/\.\./g, "")
    .replace(/[:/\\]/g, "_")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/_+/g, "_")
    .replace(/^[_.\-\s]+/, "")
    .trim();

  const safeName = name || "unnamed-file";
  return `${safeName}${ext.toLowerCase()}`;
};
