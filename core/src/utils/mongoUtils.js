"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMongoUri = parseMongoUri;
const logger_1 = __importDefault(require("./logger"));
/**
 * Parse MongoDB URI to extract connection details
 */
function parseMongoUri(uri) {
    try {
        const url = new URL(uri);
        const database = url.pathname.substring(1);
        const host = url.hostname;
        const port = url.port || '27017';
        const username = url.username;
        const password = url.password;
        return { host, port, database, username, password };
    }
    catch (error) {
        logger_1.default.error('Failed to parse MongoDB URI', { error: error instanceof Error ? error.message : String(error) });
        throw new Error('Invalid MongoDB URI');
    }
}
//# sourceMappingURL=mongoUtils.js.map