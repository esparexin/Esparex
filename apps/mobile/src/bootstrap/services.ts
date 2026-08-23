import { SecureStoreAdapter } from '../infrastructure/auth/SecureStoreAdapter';
import { AuthServiceImpl } from '../infrastructure/auth/AuthServiceImpl';
import { apiClient } from '../infrastructure/api/apiClient';
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
import { IPushNotificationEventService } from '../features/notifications/application/IPushNotificationEventService';
import { ExpoPushNotificationEventService } from '../features/notifications/infrastructure/ExpoPushNotificationEventService';
import { IPushTokenRegistrationService } from '../features/notifications/application/IPushTokenRegistrationService';
import { ApiPushTokenRegistrationService } from '../features/notifications/infrastructure/ApiPushTokenRegistrationService';
import { ApiBusinessRepository } from '../features/business/application/ApiBusinessRepository';
import { BusinessService } from '../features/business/application/BusinessService';
import { ApiPaymentRepository } from '../features/payment/application/ApiPaymentRepository';
import { PaymentService } from '../features/payment/application/PaymentService';
import { ApiSmartAlertRepository } from '../features/smartAlert/application/ApiSmartAlertRepository';
import { SmartAlertService } from '../features/smartAlert/application/SmartAlertService';

export interface IServices {
  authService: IAuthService;
  listingService: ListingService;
  postAdService: PostAdService;
  categoryService: CategoryService;
  userService: UserService;
  chatService: ChatService;
  notificationService: NotificationService;
  pushNotificationService: IPushNotificationService;
  pushNotificationEventService: IPushNotificationEventService;
  pushTokenRegistrationService: IPushTokenRegistrationService;
  imagePicker: IImagePicker;
  businessService: BusinessService;
  paymentService: PaymentService;
  smartAlertService: SmartAlertService;
}

export const bootstrapServices = (): IServices => {
  // 1. Push Notification & Registration Services
  const pushNotificationService: IPushNotificationService = new ExpoPushNotificationService();
  const pushNotificationEventService: IPushNotificationEventService = new ExpoPushNotificationEventService();
  const pushTokenRegistrationService: IPushTokenRegistrationService = new ApiPushTokenRegistrationService(
    pushNotificationService,
    apiClient
  );

  // 2. Auth (injected with pushTokenRegistrationService)
  const authService = new AuthServiceImpl(apiClient, SecureStoreAdapter, pushTokenRegistrationService);

  // 3. User
  const userRepository = new ApiUserRepository();
  const userService = new UserService(userRepository);

  // 4. Listings
  const listingRepository = new ApiListingRepository();
  const listingService = new ListingService(listingRepository);

  // 5. Post Ad (shares listingRepository)
  const imageUploadService = new ApiImageUploadService();
  const postAdService = new PostAdService(imageUploadService, listingRepository);

  // 6. Categories
  const categoryRepository = new ApiCategoryRepository();
  const categoryService = new CategoryService(categoryRepository);

  // 7. Chat
  const chatRepository = new ApiChatRepository();
  const chatService = new ChatService(chatRepository);

  // 8. Notifications
  const notificationRepository = new ApiNotificationRepository();
  const notificationService = new NotificationService(notificationRepository);

  // 9. Image Picker (native Expo adapter)
  const imagePicker = new ExpoImagePicker();

  // 10. Business
  const businessRepository = new ApiBusinessRepository();
  const businessService = new BusinessService(businessRepository);

  // 11. Payment
  const paymentRepository = new ApiPaymentRepository();
  const paymentService = new PaymentService(paymentRepository);

  // 12. Smart Alerts
  const smartAlertRepository = new ApiSmartAlertRepository();
  const smartAlertService = new SmartAlertService(smartAlertRepository);

  return {
    authService,
    userService,
    listingService,
    postAdService,
    categoryService,
    chatService,
    notificationService,
    pushNotificationService,
    pushNotificationEventService,
    pushTokenRegistrationService,
    imagePicker,
    businessService,
    paymentService,
    smartAlertService,
  };
};

export const services = bootstrapServices();
