export type ModerationThresholds = {
  scamDetection: number;
  inappropriateContent: number;
  spamDetection: number;
  counterfeits: number;
  prohibitedItems: number;
};

export type SystemConfig = {
  ai?: {
    moderation?: {
      enabled?: boolean;
      autoFlag?: boolean;
      autoBlock?: boolean;
      confidenceThreshold?: number;
      thresholds?: Partial<ModerationThresholds>;
    };
  };
  platform?: {
    maintenance?: {
      enabled?: boolean;
      message?: string;
    };
    branding?: {
      platformName?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  security?: {
    twoFactor?: {
      enabled?: boolean;
    };
    sessionTimeoutMinutes?: number;
    maxLoginAttempts?: number;
    ipWhitelist?: string[];
  };
  notifications?: {
    email?: {
      enabled?: boolean;
      provider?: "smtp" | "sendgrid" | "aws-ses";
      senderName?: string;
      senderEmail?: string;
    };
    push?: {
      enabled?: boolean;
      provider?: "firebase" | "onesignal";
    };
  };
  location?: {
    enableNearbySearch?: boolean;
    defaultSearchRadius?: number;
    maxSearchRadius?: number;
    enableAutoComplete?: boolean;
    autoCompleteMinChars?: number;
    distanceUnit?: "km" | "miles";
  };
  integrations?: {
    payment?: {
      razorpay?: {
        enabled?: boolean;
      };
      stripe?: {
        enabled?: boolean;
      };
    };
  };
  featureFlags?: Record<string, boolean>;
};

export type SystemConfigPatch = Partial<{
  ai: NonNullable<SystemConfig["ai"]>;
  security: NonNullable<SystemConfig["security"]>;
  notifications: NonNullable<SystemConfig["notifications"]>;
  platform: NonNullable<SystemConfig["platform"]>;
  featureFlags: NonNullable<SystemConfig["featureFlags"]>;
  integrations: NonNullable<SystemConfig["integrations"]>;
  emailTemplates: unknown[];
  notificationTemplates: unknown[];
  location: NonNullable<SystemConfig["location"]>;
}>;
