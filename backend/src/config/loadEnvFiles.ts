import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

type LoadEnvFilesOptions = {
    cwd?: string;
    nodeEnv?: string;
    processEnv?: NodeJS.ProcessEnv;
};

const loadFileIntoEnv = (
    cwd: string,
    fileName: string,
    processEnv: NodeJS.ProcessEnv,
    fileManagedKeys: Set<string>,
    loadedFiles: string[]
): void => {
    const filePath = path.join(cwd, fileName);

    if (!fs.existsSync(filePath)) {
        return;
    }

    const parsed = dotenv.parse(fs.readFileSync(filePath, 'utf8'));

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

export function loadEnvFiles(options: LoadEnvFilesOptions = {}): string[] {
    const cwd = options.cwd ?? path.resolve(__dirname, '../..');
    const targetEnv = options.processEnv ?? process.env;
    const fileManagedKeys = new Set<string>();
    const loadedFiles: string[] = [];

    loadFileIntoEnv(cwd, '.env', targetEnv, fileManagedKeys, loadedFiles);

    const effectiveNodeEnv =
        (options.nodeEnv ?? targetEnv.NODE_ENV ?? 'development').trim() || 'development';

    loadFileIntoEnv(cwd, `.env.${effectiveNodeEnv}`, targetEnv, fileManagedKeys, loadedFiles);

    if (effectiveNodeEnv !== 'test') {
        loadFileIntoEnv(cwd, '.env.local', targetEnv, fileManagedKeys, loadedFiles);
        loadFileIntoEnv(cwd, `.env.${effectiveNodeEnv}.local`, targetEnv, fileManagedKeys, loadedFiles);
    }

    return loadedFiles;
}

export default loadEnvFiles;
