"use client";

import { mapErrorToMessage } from "@/lib/errorMapper";
import type { } from "@/components/user/profile/types";

export const getErrorMessage = (rawError: unknown, fallback: string): string =>
  mapErrorToMessage(rawError, fallback);




