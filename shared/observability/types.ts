export type LogLevel = 'debug' | 'info' | 'warn' | 'warning' | 'error' | 'http';

export type LogDetails = Record<string, unknown>;

export interface Logger {
    level: string;
    log(level: LogLevel, message: unknown, ...meta: unknown[]): void;
    debug(message: unknown, ...meta: unknown[]): void;
    info(message: unknown, ...meta: unknown[]): void;
    warn(message: unknown, ...meta: unknown[]): void;
    warning(message: unknown, ...meta: unknown[]): void;
    error(message: unknown, ...meta: unknown[]): void;
    http(message: unknown, ...meta: unknown[]): void;
    child(defaultMeta: LogDetails): Logger;
}

export interface ObservabilityConfig {
    serviceName: string;
    environment: string;
    level?: LogLevel;
}
