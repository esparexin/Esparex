/**
 * UploadedImage — immutable domain value object representing a successfully uploaded cloud image asset.
 *
 * Encapsulates the unique storage `key` alongside an optional public access `url`.
 * This separates the domain representation from raw string primitives across
 * upload service and repository boundaries.
 */
export interface UploadedImage {
  readonly key: string;
  readonly url?: string;
}
