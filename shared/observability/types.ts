export type LogLevel = 'debug' | 'info' | 'warn' | 'warning' | 'error' | 'http';

export type LogDetails = any;
// export interface LogDetails {
//     [key: string]: unknown;
// }

export interface Logger {
    level: LogLevel;
    log(level: LogLevel, message: any, ...meta: any[]): void;
    debug(message: any, ...meta: any[]): void;
    info(message: any, ...meta: any[]): void;
    warn(message: any, ...meta: any[]): void;
    warning(message: any, ...meta: any[]): void;
    error(message: any, ...meta: any[]): void;
    http(message: any, ...meta: any[]): void;
    child(defaultMeta: LogDetails): Logger;
}

export interface ObservabilityConfig {
    serviceName: string;
    environment: string;
    level?: LogLevel;
}
