"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnvFiles = loadEnvFiles;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const loadFileIntoEnv = (cwd, fileName, processEnv, fileManagedKeys, loadedFiles) => {
    const filePath = path_1.default.join(cwd, fileName);
    if (!fs_1.default.existsSync(filePath)) {
        return;
    }
    const parsed = dotenv_1.default.parse(fs_1.default.readFileSync(filePath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
        const currentValue = processEnv[key];
        const isUnset = typeof currentValue === 'undefined';
        const wasSetByEnvFile = fileManagedKeys.has(key);
        if (isUnset || wasSetByEnvFile) {
            processEnv[key] = value;
            fileManagedKeys.add(key);
        }
    }
    loadedFiles.push(filePath);
};
function loadEnvFiles(options = {}) {
    const cwd = options.cwd ?? path_1.default.resolve(__dirname, '../..');
    const targetEnv = options.processEnv ?? process.env;
    const fileManagedKeys = new Set();
    const loadedFiles = [];
    loadFileIntoEnv(cwd, '.env', targetEnv, fileManagedKeys, loadedFiles);
    const effectiveNodeEnv = (options.nodeEnv ?? targetEnv.NODE_ENV ?? 'development').trim() || 'development';
    loadFileIntoEnv(cwd, `.env.${effectiveNodeEnv}`, targetEnv, fileManagedKeys, loadedFiles);
    if (effectiveNodeEnv !== 'test') {
        loadFileIntoEnv(cwd, '.env.local', targetEnv, fileManagedKeys, loadedFiles);
        loadFileIntoEnv(cwd, `.env.${effectiveNodeEnv}.local`, targetEnv, fileManagedKeys, loadedFiles);
    }
    return loadedFiles;
}
exports.default = loadEnvFiles;
//# sourceMappingURL=loadEnvFiles.js.map