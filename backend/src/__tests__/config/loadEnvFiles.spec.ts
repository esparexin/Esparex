import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadEnvFiles } from '../../config/loadEnvFiles';

const tempDirs: string[] = [];

const createEnvDir = (files: Record<string, string>): string => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'esparex-env-'));
    tempDirs.push(dir);

    for (const [name, contents] of Object.entries(files)) {
        fs.writeFileSync(path.join(dir, name), contents);
    }

    return dir;
};

afterAll(() => {
    for (const dir of tempDirs) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('loadEnvFiles', () => {
    it('lets .env.local override values loaded from .env', () => {
        const cwd = createEnvDir({
            '.env': 'NODE_ENV=development\nUSE_DEFAULT_OTP=false\nDEV_STATIC_OTP=000000\n',
            '.env.local': 'USE_DEFAULT_OTP=true\nDEV_STATIC_OTP=123456\n',
        });
        const processEnv: NodeJS.ProcessEnv = {};

        loadEnvFiles({ cwd, processEnv });

        expect(processEnv.USE_DEFAULT_OTP).toBe('true');
        expect(processEnv.DEV_STATIC_OTP).toBe('123456');
    });

    it('does not override explicit shell environment values', () => {
        const cwd = createEnvDir({
            '.env': 'NODE_ENV=development\nUSE_DEFAULT_OTP=false\n',
            '.env.local': 'USE_DEFAULT_OTP=true\n',
        });
        const processEnv: NodeJS.ProcessEnv = {
            NODE_ENV: 'development',
            USE_DEFAULT_OTP: 'false',
        };

        loadEnvFiles({ cwd, processEnv });

        expect(processEnv.USE_DEFAULT_OTP).toBe('false');
    });

    it('skips .env.local when NODE_ENV is test', () => {
        const cwd = createEnvDir({
            '.env': 'USE_DEFAULT_OTP=false\n',
            '.env.test': 'DEV_STATIC_OTP=654321\n',
            '.env.local': 'USE_DEFAULT_OTP=true\nDEV_STATIC_OTP=123456\n',
        });
        const processEnv: NodeJS.ProcessEnv = {
            NODE_ENV: 'test',
        };

        loadEnvFiles({ cwd, processEnv });

        expect(processEnv.USE_DEFAULT_OTP).toBe('false');
        expect(processEnv.DEV_STATIC_OTP).toBe('654321');
    });
});
