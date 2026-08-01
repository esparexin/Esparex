import * as ImagePicker from 'expo-image-picker';
import { IImagePicker, PickImagesResult } from '../application/IImagePicker';
import { PickedImage } from '../domain/PickedImage';

/**
 * ExpoImagePicker — concrete native implementation of IImagePicker.
 *
 * Encapsulates native expo-image-picker calls, permission checks, asset parsing,
 * and cancellation handling. Maps native assets to PickedImage value objects.
 */
export class ExpoImagePicker implements IImagePicker {
  public async pick(): Promise<PickImagesResult> {
    try {
      // 1. Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        return {
          success: false,
          reason: 'permission-denied',
          message: 'Permission to access photo library was denied.',
        };
      }

      // 2. Launch library picker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      // 3. Handle cancellation
      if (pickerResult.canceled) {
        return { success: false, reason: 'cancelled' };
      }

      // 4. Map native assets to PickedImage value objects
      const images: PickedImage[] = (pickerResult.assets || [])
        .filter((asset) => Boolean(asset.uri))
        .map((asset: ImagePicker.ImagePickerAsset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName ?? undefined,
          mimeType: asset.mimeType ?? 'image/jpeg',
        }));

      return { success: true, images };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown image picker error';
      return { success: false, reason: 'error', message };
    }
  }
}
