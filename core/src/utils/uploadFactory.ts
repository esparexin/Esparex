import multer from 'multer';
import os from 'os';
import path from 'path';
import { AppError } from './AppError';

/**
 * Universal Multer Upload Factory
 * Centralizes storage, limits, and file filtering logic across all domains.
 * Prevents fragmented upload security rules.
 */

export interface UploadConfig {
    allowedMimeTypes: string[];
    maxFileSize: number; // in bytes
    errorLabel?: string;
}

/**
 * Creates a standard Multer upload middleware with common governance rules.
 * @param config Configuration for the upload instance.
 * @returns Multer upload object.
 */
export const createUploadMiddleware = (config: UploadConfig) => {
    return multer({
        // Standard disk storage to os.tmpdir to prevent OOM on large spikes
        storage: multer.diskStorage({
            destination: os.tmpdir(),
            filename: (_req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
            }
        }),
        limits: {
            fileSize: config.maxFileSize
        },
        fileFilter: (_req, file, cb) => {
            if (config.allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                const label = config.errorLabel || 'file type';
                cb(new AppError(
                    `Invalid ${label}: ${file.mimetype}. Allowed: ${config.allowedMimeTypes.join(', ')}`,
                    400,
                    'INVALID_UPLOAD_TYPE'
                ));
            }
        }
    });
};
