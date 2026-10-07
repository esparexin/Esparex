import { PickedImage } from '../domain/PickedImage';

/**
 * PickImagesReason — cause of non-success outcome.
 */
type PickImagesReason = 'cancelled' | 'permission-denied' | 'error';

/**
 * PickImagesResult — discriminated union for image selection outcome.
 *
 * `images` is the single source of truth for selected image value objects.
 */
export type PickImagesResult =
  | { success: true; images: readonly PickedImage[] }
  | { success: false; reason: PickImagesReason; message?: string };


/**
 * IImagePicker — stable interface for device image selection and camera capture.
 */
export interface IImagePicker {
  pick(): Promise<PickImagesResult>;
  captureFromCamera(): Promise<PickImagesResult>;
}

/**
 * MockImagePicker — development stub for testing.
 */
export class MockImagePicker implements IImagePicker {
  public async pick(): Promise<PickImagesResult> {
    const mockItem: PickedImage = { uri: 'mock://image-1', width: 400, height: 400, mimeType: 'image/jpeg' };
    return { success: true, images: [mockItem] };
  }

  public async captureFromCamera(): Promise<PickImagesResult> {
    const mockItem: PickedImage = { uri: 'mock://camera-1', width: 800, height: 600, mimeType: 'image/jpeg' };
    return { success: true, images: [mockItem] };
  }
}
