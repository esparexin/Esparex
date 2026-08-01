/**
 * PickedImage — immutable domain value object representing a device-selected image asset.
 *
 * Encapsulates the local file URI alongside optional metadata (dimensions, filename, mimeType).
 * Using this value object instead of raw strings ensures the interface is extensible
 * when image compression and upload metadata are introduced in PR 3 & 4.
 */
export interface PickedImage {
  readonly uri: string;
  readonly width?: number;
  readonly height?: number;
  readonly fileName?: string;
  readonly mimeType?: string;
}
