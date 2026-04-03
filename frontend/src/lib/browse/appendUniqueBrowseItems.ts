type BrowseIdentityRecord = {
  id?: unknown;
  _id?: unknown;
};

const resolveBrowseItemIdentity = (item: unknown): string | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as BrowseIdentityRecord;
  const rawIdentity = record.id ?? record._id;

  if (typeof rawIdentity !== "string" && typeof rawIdentity !== "number") {
    return null;
  }

  const identity = String(rawIdentity).trim();
  return identity.length > 0 ? identity : null;
};

export function appendUniqueBrowseItems<T>(current: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return current;

  const seen = new Set(
    current
      .map((item) => resolveBrowseItemIdentity(item))
      .filter((identity): identity is string => identity !== null)
  );

  const additions = incoming.filter((item) => {
    const identity = resolveBrowseItemIdentity(item);
    if (!identity) {
      return true;
    }
    if (seen.has(identity)) {
      return false;
    }
    seen.add(identity);
    return true;
  });

  return additions.length > 0 ? [...current, ...additions] : current;
}
