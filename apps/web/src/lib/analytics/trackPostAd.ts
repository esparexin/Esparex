import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";

export type PostAdEventName =
  | "post_ad_opened"
  | "category_selected"
  | "brand_selected"
  | "model_selected"
  | "spare_parts_selected"
  | "condition_selected"
  | "title_entered"
  | "description_entered"
  | "price_entered"
  | "image_uploaded"
  | "image_removed"
  | "location_selected"
  | "ai_title_generated"
  | "ai_description_generated"
  | "validation_error"
  | "image_upload_failure"
  | "ai_generation_failure"
  | "step_completed"
  | "publish_clicked"
  | "publish_success"
  | "publish_failure"
  | "wizard_abandoned"
  | "ai_title_generated_from_cache"
  | "ai_description_generated_from_cache";

export interface PostAdEventPayload {
  event: PostAdEventName;
  step?: number;
  field?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

let eventQueue: PostAdEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (eventQueue.length === 0) return;
  const batch = eventQueue;
  eventQueue = [];
  apiClient.post(API_ROUTES.USER.ANALYTICS_POST_AD_EVENT, batch[batch.length - 1], { silent: true }).catch(() => {});
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 500);
}

export function trackPostAdEvent(event: PostAdEventPayload): void {
  eventQueue.push(event);
  scheduleFlush();
}
