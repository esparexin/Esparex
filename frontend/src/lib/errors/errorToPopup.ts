import type { APIError } from "@/lib/api/APIError";
import type { PopupType } from "@/lib/popup/popupEvents";

export function errorToPopup(error: APIError): {
  type: PopupType;
  title: string;
  message: string;
  code?: string;
  endpoint?: string;
  source?: string;
} {
  let type: PopupType = "error";

  if (error.status === 404) type = "info";
  else if (error.status === 400 || error.status === 409) type = "warning";
  else if (error.status >= 500 || error.status === 0) type = "error";
  else if (error.status === 401 || error.status === 403) type = "error";

  return {
    type,
    title: error.code || (type === "error" ? "Request Failed" : "Notice"),
    message: error.message || "Unexpected error occurred.",
    code: error.code,
    endpoint: error.context?.endpoint,
    source: error.source,
  };
}
