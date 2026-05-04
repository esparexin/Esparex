"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpsEmitter = exports.writeRunArtifact = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ensureLogsDir = () => {
    const logsDir = path_1.default.resolve(process.cwd(), 'logs', 'ops');
    fs_1.default.mkdirSync(logsDir, { recursive: true });
    return logsDir;
};
const writeRunArtifact = (artifact) => {
    const logsDir = ensureLogsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path_1.default.join(logsDir, `${artifact.command}-${timestamp}-${artifact.runId}.json`);
    fs_1.default.writeFileSync(filePath, JSON.stringify(artifact, null, 2), 'utf8');
    return filePath;
};
exports.writeRunArtifact = writeRunArtifact;
const createOpsEmitter = (runId) => {
    return (event, payload = {}) => {
        const row = {
            ts: new Date().toISOString(),
            runId,
            event,
            ...payload,
        };
        process.stdout.write(`${JSON.stringify(row)}\n`);
    };
};
exports.createOpsEmitter = createOpsEmitter;
//# sourceMappingURL=logger.js.map