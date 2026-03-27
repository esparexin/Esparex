import { isAPIError } from "@/lib/api/APIError";
import type { AccountListingSection } from "@/lib/accountListingRoutes";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { EsparexError } from "@/lib/errorHandler";
import { LISTING_TYPE } from "@shared/enums/listingType";

export const DEFAULT_LISTING_UNAVAILABLE_MESSAGE =
  "This listing is no longer available. It may have been removed, expired, or already sold.";

function getErrorStatusCode(error: unknown): number | undefined {
  if (isAPIError(error)) {
    return error.status || error.response?.status || error.context?.statusCode;
  }

  if (error instanceof EsparexError) {
    const statusCode = error.context?.statusCode;
    return typeof statusCode === "number" ? statusCode : undefined;
  }

  if (error && typeof error === "object") {
    const record = error as {
      status?: unknown;
      statusCode?: unknown;
      response?: { status?: unknown };
      context?: { statusCode?: unknown };
    };

    if (typeof record.status === "number") return record.status;
    if (typeof record.statusCode === "number") return record.statusCode;
    if (typeof record.response?.status === "number") return record.response.status;
    if (typeof record.context?.statusCode === "number") return record.context.statusCode;
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

export function isListingUnavailableError(error: unknown): boolean {
  if (getErrorStatusCode(error) === 404) {
    return true;
  }

  const normalizedMessage = getErrorMessage(error);
  return (
    normalizedMessage.includes("listing not found") ||
    normalizedMessage.includes("ad not found") ||
    normalizedMessage.includes("service not found") ||
    normalizedMessage.includes("spare part listing not found") ||
    normalizedMessage.includes("not found or unauthorized")
  );
}

export function getAccountListingSectionForType(listingType: unknown): AccountListingSection {
  switch (listingType) {
    case LISTING_TYPE.SERVICE:
      return "services";
    case LISTING_TYPE.SPARE_PART:
      return "spare-parts";
    case LISTING_TYPE.AD:
    default:
      return "ads";
  }
}

export function buildOwnerMissingListingRoute(listing: {
  listingType?: unknown;
  status?: unknown;
}): string {
  return buildAccountListingRoute(
    getAccountListingSectionForType(listing.listingType),
    listing.status
  );
}
