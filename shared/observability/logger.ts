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

    private serializeValue(value: unknown, seen = new WeakSet<object>()): unknown {
        if (value instanceof Error) {
            const serialized: Record<string, unknown> = {
                name: value.name,
                message: value.message,
            };

            if (value.stack) serialized.stack = value.stack;

            for (const [key, nestedValue] of Object.entries(value as unknown as Record<string, unknown>)) {
                if (!(key in serialized)) {
                    serialized[key] = this.serializeValue(nestedValue, seen);
                }
            }

            return serialized;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'bigint') {
            return value.toString();
        }

        if (Array.isArray(value)) {
            return value.map((entry) => this.serializeValue(entry, seen));
        }

        if (value && typeof value === 'object') {
            if (seen.has(value)) {
                return '[Circular]';
            }

            seen.add(value);

            try {
                const candidate = value as { toJSON?: () => unknown };
                if (typeof candidate.toJSON === 'function') {
                    const serialized = candidate.toJSON();
                    if (serialized !== value) {
                        return this.serializeValue(serialized, seen);
                    }
                }
            } catch {
                // Fall through to plain object serialization.
            }

            const serialized: Record<string, unknown> = {};
            for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
                serialized[key] = this.serializeValue(nestedValue, seen);
            }
            return serialized;
        }

        return value;
    }

    private safeStringify(value: unknown): string {
        try {
            return JSON.stringify(this.serializeValue(value));
        } catch {
            return String(value);
        }
    }

    private format(message: any, ...meta: any[]): string {
        const defaultMeta = { ...this.defaultMeta };
        let msgStr = '';
        if (message instanceof Error) {
            msgStr = message.stack || message.message;
            const serialized = this.serializeValue(message) as Record<string, unknown>;
            const extraEntries = Object.entries(serialized).filter(([key]) => !['name', 'message', 'stack'].includes(key));
            if (extraEntries.length > 0) {
                msgStr += ` ${this.safeStringify(Object.fromEntries(extraEntries))}`;
            }
        } else if (typeof message === 'object') {
            msgStr = this.safeStringify(message);
        } else {
            msgStr = String(message);
        }

        let metaStr = '';
        if (meta.length > 0) {
            metaStr = ` ${this.safeStringify(meta)}`;
        }
        const defaultMetaStr = Object.keys(defaultMeta).length > 0 ? ` ${this.safeStringify(defaultMeta)}` : '';
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
