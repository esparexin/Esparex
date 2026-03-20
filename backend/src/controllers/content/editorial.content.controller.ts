import logger from '../../utils/logger';
import { Request, Response } from 'express';
import PageContent from '../../models/PageContent';
import { getSingleParam } from '../../utils/requestParams';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';

/**
 * EditorialContentController
 * ---------------------------------------------------------
 * Manages platform editorial content and copy (About, FAQ, Terms).
 * Unified persistence for dynamic platform pages.
 * ---------------------------------------------------------
 */

export const getContentBySlug = async (req: Request, res: Response) => {
    try {
        const slug = getSingleParam(req, res, 'slug', { error: 'Invalid slug' });
        if (!slug) return;
        const content = await PageContent.findOne({ slug });

        if (!content) {
            return res.status(200).json(respond({
                success: true,
                data: {
                    slug,
                    title: slug.charAt(0).toUpperCase() + slug.slice(1),
                    content: '',
                    items: []
                }
            }));
        }

        res.status(200).json(respond({ success: true, data: content }));
    } catch (error) {
        logger.error('Error fetching content:', error);
        sendErrorResponse(req, res, 500, 'Internal server error');
    }
};

export const updateContentBySlug = async (req: Request, res: Response) => {
    try {
        const slug = getSingleParam(req, res, 'slug', { error: 'Invalid slug' });
        if (!slug) return;
        const { title, content, items, metadata } = req.body;
        const adminId = req.admin?.id;

        const updatedContent = await PageContent.findOneAndUpdate(
            { slug },
            { title, content, items, metadata, updatedBy: adminId },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(respond({
            success: true,
            message: `Content for ${slug} updated successfully`,
            data: updatedContent
        }));
    } catch (error) {
        logger.error('Error updating content:', error);
        sendErrorResponse(req, res, 500, 'Internal server error');
    }
};

export const getAllContent = async (req: Request, res: Response) => {
    try {
        const contents = await PageContent.find({}, 'slug title updatedAt');
        res.status(200).json(respond({ success: true, data: contents }));
    } catch (error) {
        logger.error('Error fetching all contents:', error);
        sendErrorResponse(req, res, 500, 'Internal server error');
    }
};
