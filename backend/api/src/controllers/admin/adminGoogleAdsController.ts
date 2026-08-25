import { Request, Response } from "express";
import {
    getPaginationParams,
    sendPaginatedResponse,
    sendSuccessResponse,
    sendAdminError,
} from "../../utils/adminBaseController";
import { logAdminAction } from "../../utils/adminLogger";
import { getSingleParam } from "../../utils/requestParams";
import {
    getAdminGoogleAdPlacements,
    createGoogleAdPlacement,
    updateGoogleAdPlacement,
    mutateGoogleAdPlacementStatus,
    deleteGoogleAdPlacement,
} from "@esparex/core/services/GoogleAdsService";
import {
    createGoogleAdPlacementSchema,
    updateGoogleAdPlacementSchema,
    mutateGoogleAdStatusSchema,
} from "@esparex/contracts";

export const getGoogleAdPlacements = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
        const location = typeof req.query.location === "string" ? req.query.location.trim() : undefined;
        const search = typeof (req.query.q || req.query.search) === "string" ? String(req.query.q || req.query.search).trim() : undefined;

        const { items, total } = await getAdminGoogleAdPlacements({
            status,
            location,
            search,
            skip,
            limit,
        });

        sendPaginatedResponse(res, items, total, page, limit);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const createAdPlacement = async (req: Request, res: Response) => {
    try {
        const validation = createGoogleAdPlacementSchema.safeParse(req.body);
        if (!validation.success) {
            return sendAdminError(req, res, validation.error.issues[0]?.message || "Invalid placement payload", 400);
        }

        const placement = await createGoogleAdPlacement(validation.data);
        await logAdminAction(req, "CREATE_GOOGLE_AD_PLACEMENT", "GoogleAdPlacement", placement.id, {
            placementKey: placement.placementKey,
            location: placement.location,
            format: placement.format,
        });

        sendSuccessResponse(res, placement, "Google Ad placement created successfully");
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateAdPlacement = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, "id", { error: "Invalid placement ID" });
        if (!id) return;

        const validation = updateGoogleAdPlacementSchema.safeParse(req.body);
        if (!validation.success) {
            return sendAdminError(req, res, validation.error.issues[0]?.message || "Invalid placement payload", 400);
        }

        const placement = await updateGoogleAdPlacement(id, validation.data);
        await logAdminAction(req, "UPDATE_GOOGLE_AD_PLACEMENT", "GoogleAdPlacement", id, {
            placementKey: placement.placementKey,
            location: placement.location,
        });

        sendSuccessResponse(res, placement, "Google Ad placement updated successfully");
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const mutateAdPlacementStatus = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, "id", { error: "Invalid placement ID" });
        if (!id) return;

        const { status } = mutateGoogleAdStatusSchema.parse(req.body);

        const placement = await mutateGoogleAdPlacementStatus(id, status);
        await logAdminAction(req, "MUTATE_GOOGLE_AD_STATUS", "GoogleAdPlacement", id, { status });

        sendSuccessResponse(res, placement, `Google Ad placement ${status} successfully`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const removeAdPlacement = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, "id", { error: "Invalid placement ID" });
        if (!id) return;

        await deleteGoogleAdPlacement(id);
        await logAdminAction(req, "DELETE_GOOGLE_AD_PLACEMENT", "GoogleAdPlacement", id, {});

        sendSuccessResponse(res, { id }, "Google Ad placement deleted successfully");
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
