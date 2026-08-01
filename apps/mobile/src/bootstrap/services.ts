import { SecureStoreAdapter } from '../infrastructure/auth/SecureStoreAdapter';
import { AuthServiceImpl } from '../infrastructure/auth/AuthServiceImpl';
import { apiClient } from '../infrastructure/api/apiClient';
import { setRefreshExecutor } from '../infrastructure/api/refreshQueue';
import { IAuthService } from '../infrastructure/auth/AuthService';
import { ApiListingRepository } from '../features/listings/application/ApiListingRepository';
import { ListingService } from '../features/listings/application/ListingService';
import { ApiImageUploadService } from '../features/postAd/application/IImageUploadService';
import { PostAdService } from '../features/postAd/application/PostAdService';
import { ApiCategoryRepository } from '../features/postAd/application/ApiCategoryRepository';
import { CategoryService } from '../features/postAd/application/CategoryService';
import { ExpoImagePicker } from '../features/postAd/infrastructure/ExpoImagePicker';
import { IImagePicker } from '../features/postAd/application/IImagePicker';

export interface IServices {
  authService: IAuthService;
  listingService: ListingService;
  postAdService: PostAdService;
  categoryService: CategoryService;
  imagePicker: IImagePicker;
}

export const bootstrapServices = (): IServices => {
  // 1. Auth
  const authService = new AuthServiceImpl(apiClient, SecureStoreAdapter);
  setRefreshExecutor(authService.executeTokenRefresh);

  // 2. Listings
  const listingRepository = new ApiListingRepository();
  const listingService = new ListingService(listingRepository);

  // 3. Post Ad (shares listingRepository — no duplicate instantiation)
  const imageUploadService = new ApiImageUploadService();
  const postAdService = new PostAdService(imageUploadService, listingRepository);

  // 4. Categories
  const categoryRepository = new ApiCategoryRepository();
  const categoryService = new CategoryService(categoryRepository);

  // 5. Image Picker (native Expo adapter)
  const imagePicker = new ExpoImagePicker();

  return {
    authService,
    listingService,
    postAdService,
    categoryService,
    imagePicker,
  };
};

