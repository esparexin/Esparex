import { Request, Response } from "express";
import { Types } from "mongoose";
import logger from "../../utils/logger";
import { respond } from "../../utils/respond";
import { sendErrorResponse } from "../../utils/errorResponse";
import { getUserId } from "./shared";
import { getVisibleNotificationWindowQuery } from "../../services/notification/NotificationRetentionService";
import { queryNotificationsForUser } from "../../services/NotificationService";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return sendErrorResponse(req, res, 401, "Unauthorized");

        const {
            page = 1,
            limit = 20,
            filter = "all",
            type = "all",
            q,
        } = req.query as unknown as {
            page: number;
            limit: number;
            filter: "all" | "unread";
            type: string;
            q?: string;
        };

        const skip = (Number(page) - 1) * Number(limit);
        const now = new Date();
        // Must cast to ObjectId — MongoDB aggregation $match does NOT auto-coerce
        // strings to ObjectId the way Mongoose find/update helpers do.
        const userObjectId = new Types.ObjectId(userId);
        const queryClauses: Record<string, unknown>[] = [{ userId: userObjectId }];

        if (filter === "unread") {
            queryClauses.push({ isRead: false });
        } else {
            queryClauses.push(getVisibleNotificationWindowQuery(now));
        }

        if (type && type !== "all") {
            queryClauses.push({ type });
        }

        if (typeof q === "string" && q.trim().length > 0) {
            queryClauses.push({
                $or: [
                    { title: { $regex: escapeRegex(q.trim()), $options: "i" } },
                    { message: { $regex: escapeRegex(q.trim()), $options: "i" } },
                ],
            });
        }

        const query: Record<string, unknown> =
            queryClauses.length === 1 ? (queryClauses[0] ?? {}) : { $and: queryClauses };

        const { notifications, total, unreadCount } = await queryNotificationsForUser(query, userId, skip, limit);

        return res.json(
            respond({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit),
                    },
                    unreadCount,
                },
            })
        );
    } catch (error) {
        logger.error("Get Notifications Error:", error);
        return sendErrorResponse(req, res, 500, "Failed to fetch notifications");
    }
};
