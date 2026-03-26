import type { Logger, LogDetails, LogLevel } from './types';

/**
 * Universal Logger implementation that works in both Node and Browser.
 */
class UniversalLogger implements Logger {
    public level: LogLevel = 'info';

    constructor(
        private prefix: string = '',
        private defaultMeta: LogDetails = {}
    ) {}

    private format(message: any, ...meta: any[]): string {
        const defaultMeta = { ...this.defaultMeta };
        let msgStr = '';
        if (message instanceof Error) {
            msgStr = message.stack || message.message;
        } else if (typeof message === 'object') {
            try {
                msgStr = JSON.stringify(message);
            } catch {
                msgStr = String(message);
            }
        } else {
            msgStr = String(message);
        }

        let metaStr = '';
        if (meta.length > 0) {
            try {
                metaStr = ` ${JSON.stringify(meta)}`;
            } catch {
                metaStr = ` [Complex Meta]`;
            }
        }
        const defaultMetaStr = Object.keys(defaultMeta).length > 0 ? ` ${JSON.stringify(defaultMeta)}` : '';
        return `${this.prefix}${msgStr}${metaStr}${defaultMetaStr}`;
    }

    public log(level: LogLevel, message: any, ...meta: any[]): void {
        const formatted = this.format(message, ...meta);
        switch (level) {
            case 'debug': console.debug(formatted); break;
            case 'info': console.info(formatted); break;
            case 'warn':
            case 'warning': console.warn(formatted); break;
            case 'error': console.error(formatted); break;
            case 'http': console.log(`[HTTP] ${formatted}`); break;
        }
    }

    debug(message: any, ...meta: any[]): void { this.log('debug', message, ...meta); }
    info(message: any, ...meta: any[]): void { this.log('info', message, ...meta); }
    warn(message: any, ...meta: any[]): void { this.log('warn', message, ...meta); }
    warning(message: any, ...meta: any[]): void { this.log('warning', message, ...meta); }
    error(message: any, ...meta: any[]): void { this.log('error', message, ...meta); }
    http(message: any, ...meta: any[]): void { this.log('http', message, ...meta); }

    child(defaultMeta: LogDetails): Logger {
        return new UniversalLogger(this.prefix, { ...this.defaultMeta, ...defaultMeta });
    }
}

export const createUniversalLogger = (serviceName: string): Logger => {
    return new UniversalLogger(`[${serviceName}] `);
};
