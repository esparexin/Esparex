import logger from '@core/utils/logger';
import { NextFunction, Request, Response } from 'express';
import { Service } from "@shared/types/Service";
import { ApiResponse } from "@shared/types/Api";
import { respond } from "@core/utils/respond";

import {
    createServiceMutation,
    type ServiceBusinessContext,
} from '@core/services/service/ServiceMutationService';



/* ---------------------------------------------------
   Create Service (Business User)
--------------------------------------------------- */
export const createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const service = await createServiceMutation({
            user: user, // Safe boundary cast to core type
            business: req.business as ServiceBusinessContext | undefined,
            body: req.body as Record<string, unknown>,
        });

        const response = respond<ApiResponse<Service>>({
            success: true,
            data: service as unknown as Service,
            message: 'Service submitted for approval.'
        });

        res.status(201).json(response);
    } catch (error: unknown) {
        logger.error('Create Service Error:', error);
        next(error);
    }
};


