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
import { ApiUserRepository } from '../features/user/application/ApiUserRepository';
import { UserService } from '../features/user/application/UserService';
import { ApiChatRepository } from '../features/chat/application/ApiChatRepository';
import { ChatService } from '../features/chat/application/ChatService';
import { ApiNotificationRepository } from '../features/notifications/application/ApiNotificationRepository';
import { NotificationService } from '../features/notifications/application/NotificationService';
import { IPushNotificationService } from '../features/notifications/application/IPushNotificationService';
import { ExpoPushNotificationService } from '../features/notifications/infrastructure/ExpoPushNotificationService';

export interface IServices {
  authService: IAuthService;
  listingService: ListingService;
  postAdService: PostAdService;
  categoryService: CategoryService;
  userService: UserService;
  chatService: ChatService;
  notificationService: NotificationService;
  pushNotificationService: IPushNotificationService;
  imagePicker: IImagePicker;
}

export const bootstrapServices = (): IServices => {
  // 1. Auth
  const authService = new AuthServiceImpl(apiClient, SecureStoreAdapter);
  setRefreshExecutor(authService.executeTokenRefresh);

  // 2. User
  const userRepository = new ApiUserRepository();
  const userService = new UserService(userRepository);

  // 3. Listings
  const listingRepository = new ApiListingRepository();
  const listingService = new ListingService(listingRepository);

  // 4. Post Ad (shares listingRepository)
  const imageUploadService = new ApiImageUploadService();
  const postAdService = new PostAdService(imageUploadService, listingRepository);

  // 5. Categories
  const categoryRepository = new ApiCategoryRepository();
  const categoryService = new CategoryService(categoryRepository);

  // 6. Chat
  const chatRepository = new ApiChatRepository();
  const chatService = new ChatService(chatRepository);

  // 7. Notifications
  const notificationRepository = new ApiNotificationRepository();
  const notificationService = new NotificationService(notificationRepository);

  // 8. Push notification service (device token acquisition)
  const pushNotificationService: IPushNotificationService = new ExpoPushNotificationService();

  // 9. Image Picker (native Expo adapter)
  const imagePicker = new ExpoImagePicker();

  return {
    authService,
    userService,
    listingService,
    postAdService,
    categoryService,
    chatService,
    notificationService,
    pushNotificationService,
    imagePicker,
  };
};

export const services = bootstrapServices();
