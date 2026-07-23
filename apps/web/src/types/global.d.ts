// Suppress errors for Vitest globals in node_modules
declare const vi: unknown;

// Suppress errors for internal library modules
declare module '@internal/*';

// heic2any ships no TypeScript types; declare minimal interface matching usage
declare module 'heic2any' {
  interface HeicConvertOptions {
    blob: Blob;
    toType?: string;
    quality?: number;
    multiple?: boolean;
  }
  function heic2any(options: HeicConvertOptions): Promise<Blob | Blob[]>;
  export = heic2any;
}
