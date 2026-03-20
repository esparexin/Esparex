// Suppress errors for Vitest globals in node_modules
declare const vi: unknown;

// Suppress errors for internal library modules
declare module '@internal/*';
