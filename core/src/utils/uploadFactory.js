"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const AppError_1 = require("@core/utils/AppError");
/**
 * Creates a standard Multer upload middleware with common governance rules.
 * @param config Configuration for the upload instance.
 * @returns Multer upload object.
 */
const createUploadMiddleware = (config) => {
    return (0, multer_1.default)({
        // Standard disk storage to os.tmpdir to prevent OOM on large spikes
        storage: multer_1.default.diskStorage({
            destination: os_1.default.tmpdir(),
            filename: (_req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
            }
        }),
        limits: {
            fileSize: config.maxFileSize
        },
        fileFilter: (_req, file, cb) => {
            if (config.allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                const label = config.errorLabel || 'file type';
                cb(new AppError_1.AppError(`Invalid ${label}: ${file.mimetype}. Allowed: ${config.allowedMimeTypes.join(', ')}`, 400, 'INVALID_UPLOAD_TYPE'));
            }
        }
    });
};
exports.createUploadMiddleware = createUploadMiddleware;
//# sourceMappingURL=uploadFactory.js.map