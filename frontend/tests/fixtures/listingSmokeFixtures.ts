export type ListingType = "ad" | "service" | "spare_part";

// Example contract: frontend/tests/fixtures/listingSmoke.contract.example.json

export type RevealExpectation = "mobile" | "masked" | "request_only" | "hidden";

export interface ChatSmokeFixture {
  path: string;
}

export interface RevealSmokeFixture {
  path: string;
  expect: RevealExpectation;
}

export interface ListingSmokeFixtures {
  chat: Partial<Record<ListingType, ChatSmokeFixture>>;
  reveal: RevealSmokeFixture | null;
}

interface RawChatFixture {
  path?: unknown;
}

interface RawRevealFixture {
  path?: unknown;
  expect?: unknown;
}

interface RawListingSmokeFixtures {
  chat?: Partial<Record<ListingType, RawChatFixture>>;
  reveal?: RawRevealFixture;
}

const CHAT_ENV_BY_TYPE: Record<ListingType, string> = {
  ad: "SMOKE_CHAT_AD_PATH",
  service: "SMOKE_CHAT_SERVICE_PATH",
  spare_part: "SMOKE_CHAT_SPARE_PART_PATH",
};

const SUPPORTED_REVEAL_EXPECTATIONS = new Set<RevealExpectation>([
  "mobile",
  "masked",
  "request_only",
  "hidden",
]);

function normalizePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
}

function parseFixtureContract(raw: string): RawListingSmokeFixtures {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error(
      `SMOKE_LISTING_FIXTURES must be valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("SMOKE_LISTING_FIXTURES must be a JSON object.");
  }

  return parsed as RawListingSmokeFixtures;
}

function resolveChatFixtures(raw: RawListingSmokeFixtures): ListingSmokeFixtures["chat"] {
  const fixtures: ListingSmokeFixtures["chat"] = {};

  for (const listingType of ["ad", "service", "spare_part"] as const) {
    const contractPath = normalizePath(raw.chat?.[listingType]?.path);
    const envPath = normalizePath(process.env[CHAT_ENV_BY_TYPE[listingType]]);
    const path = contractPath || envPath;

    if (path) {
      fixtures[listingType] = { path };
    }
  }

  return fixtures;
}

function resolveRevealFixture(raw: RawListingSmokeFixtures): RevealSmokeFixture | null {
  const path = normalizePath(raw.reveal?.path) || normalizePath(process.env.SMOKE_REVEAL_PATH);
  if (!path) return null;

  const rawExpectation = String(raw.reveal?.expect || process.env.SMOKE_REVEAL_EXPECT || "mobile")
    .trim()
    .toLowerCase()
    .replace(/phone_request_required/g, "request_only");

  if (!SUPPORTED_REVEAL_EXPECTATIONS.has(rawExpectation as RevealExpectation)) {
    throw new Error(
      `Unsupported SMOKE_REVEAL_EXPECT value "${rawExpectation}". ` +
        `Use one of: ${Array.from(SUPPORTED_REVEAL_EXPECTATIONS).join(", ")}.`
    );
  }

  return {
    path,
    expect: rawExpectation as RevealExpectation,
  };
}

export function resolveListingSmokeFixtures(): ListingSmokeFixtures {
  const raw = parseFixtureContract(process.env.SMOKE_LISTING_FIXTURES || "");

  return {
    chat: resolveChatFixtures(raw),
    reveal: resolveRevealFixture(raw),
  };
}

export function getMissingChatFixtureMessage(listingType: ListingType): string {
  return (
    `No ${listingType} chat fixture configured. ` +
    `Set SMOKE_LISTING_FIXTURES or ${CHAT_ENV_BY_TYPE[listingType]}.`
  );
}

export function getMissingRevealFixtureMessage(): string {
  return "No reveal fixture configured. Set SMOKE_LISTING_FIXTURES or SMOKE_REVEAL_PATH.";
}
