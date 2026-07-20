import { Request, Response } from "express";
import logger from "@esparex/core/utils/logger";
import { sendErrorResponse } from "../../utils/errorResponse";
import { respond } from "../../utils/respond";

interface PostAdEvent {
  event: string;
  step?: number;
  field?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export const logPostAdEvent = async (req: Request, res: Response) => {
  try {
    const { event, step, field, source, metadata } = req.body as PostAdEvent;
    const userId = String((req.user as unknown as Record<string, unknown>)?._id ?? "");

    if (!event || typeof event !== "string") {
      sendErrorResponse(req, res, 400, "Event name is required");
      return;
    }

    logger.info("[PostAdAnalytics]", {
      event,
      step,
      field,
      source,
      metadata,
      userId,
      timestamp: new Date().toISOString(),
    });

    res.json(respond({ success: true }));
  } catch {
    sendErrorResponse(req, res, 500, "Failed to log analytics event");
  }
};
