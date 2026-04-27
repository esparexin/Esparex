"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.catalogSuggest = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const errorResponse_1 = require("@core/utils/errorResponse");
const respond_1 = require("@core/utils/respond");
const AiService_1 = require("@core/services/AiService");
const catalogSuggest = async (req, res) => {
    try {
        const { image, contextText } = (0, AiService_1.getAiContext)(req.body);
        if (!image && !contextText) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Image or context text is required for AI identification');
            return;
        }
        const result = await (0, AiService_1.executeAiRequest)({
            type: 'identify',
            context: {},
            image,
            contextText
        });
        if (result.ok) {
            res.json((0, respond_1.respond)({ success: true, data: result.data }));
            return;
        }
        (0, errorResponse_1.sendErrorResponse)(req, res, result.status, result.error, {
            ...(result.code ? { code: result.code } : {}),
            ...(result.details ? { details: result.details } : {}),
        });
    }
    catch (error) {
        logger_1.default.error('[AI Controller] catalogSuggest failed', { error: error.message });
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, 'Internal AI processing error');
    }
};
exports.catalogSuggest = catalogSuggest;
const generate = async (req, res) => {
    try {
        if (!req.user) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
            return;
        }
        const body = (req.body || {});
        if (!(0, AiService_1.isAIRequestType)(body?.type)) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Unsupported AI request type');
            return;
        }
        const { context, image, contextText } = (0, AiService_1.getAiContext)(body);
        const result = await (0, AiService_1.executeAiRequest)({
            type: body.type,
            context,
            image,
            contextText
        });
        if (result.ok) {
            res.json((0, respond_1.respond)({ success: true, data: result.data }));
            return;
        }
        (0, errorResponse_1.sendErrorResponse)(req, res, result.status, result.error, {
            ...(result.code ? { code: result.code } : {}),
            ...(result.details ? { details: result.details } : {}),
        });
        return;
    }
    catch (error) {
        const err = error;
        logger_1.default.error('AI Service Error:', err);
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, 'AI Service Error');
    }
};
exports.generate = generate;
//# sourceMappingURL=aiController.js.map