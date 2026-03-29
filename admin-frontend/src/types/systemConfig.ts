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
      reportAutoHideThreshold?: number;
      thresholds?: Partial<ModerationThresholds>;
    };
    seo?: {
      enableTitleSEO?: boolean;
      enableDescriptionSEO?: boolean;
      titleProvider?: "openai" | "local" | "custom";
      descriptionProvider?: "openai" | "local" | "custom";
      openaiApiKey?: string;
      customApiEndpoint?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  platform?: {
    maintenance?: {
      enabled?: boolean;
      message?: string;
      allowedIps?: string[];
      scheduledEnd?: string;
      bypassToken?: string;
    };
    branding?: {
      platformName?: string;
      tagline?: string;
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      faviconUrl?: string;
    };
  };
  security?: {
    twoFactor?: {
      enabled?: boolean;
      issuer?: string;
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
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      encryption?: "none" | "ssl" | "tls";
    };
    push?: {
      enabled?: boolean;
      provider?: "firebase" | "onesignal";
    };
  };
  location?: {
    radiusKm?: number;
    enableGeolocation?: boolean;
    defaultCenter?: { type: "Point"; coordinates: [number, number] };
    mapProvider?: "google" | "mapbox" | "openstreetmap";
    mapboxAccessToken?: string;
    distanceUnit?: "km" | "miles";
    defaultSearchRadius?: number;
    maxSearchRadius?: number;
    geocodingProvider?: "google" | "mapbox" | "nominatim";
    enableReverseGeocoding?: boolean;
    enableAutoComplete?: boolean;
    autoCompleteMinChars?: number;
    requireLocationVerification?: boolean;
    autoApproveHighConfidence?: boolean;
    confidenceThreshold?: number;
    showExactCoordinates?: boolean;
    blurLocationRadius?: number;
    allowGpsTracking?: boolean;
    enableGeofencing?: boolean;
    enableLocationHistory?: boolean;
    enableNearbySearch?: boolean;
    showDistanceInListings?: boolean;
  };
  integrations?: {
    googleMaps?: {
      apiKey?: string;
      enabled?: boolean;
    };
    sms?: {
      provider?: string;
      apiKey?: string;
      apiSecret?: string;
      senderId?: string;
      rateLimit?: number;
    };
    payment?: {
      razorpay?: {
        enabled?: boolean;
        keyId?: string;
        keySecret?: string;
      };
      stripe?: {
        enabled?: boolean;
        publishableKey?: string;
        secretKey?: string;
      };
    };
  };
  listing?: {
    expiryDays?: {
      ad?: number;
      service?: number;
      spare_part?: number;
    };
    thresholds?: {
      proSparePartLimit?: number;
    };
  };
  emailTemplates?: unknown[];
  notificationTemplates?: unknown[];
};

export type SystemConfigPatch = Partial<{
  ai: NonNullable<SystemConfig["ai"]>;
  security: NonNullable<SystemConfig["security"]>;
  notifications: NonNullable<SystemConfig["notifications"]>;
  platform: NonNullable<SystemConfig["platform"]>;
  integrations: NonNullable<SystemConfig["integrations"]>;
  location: NonNullable<SystemConfig["location"]>;
  listing: NonNullable<SystemConfig["listing"]>;
  emailTemplates: unknown[];
  notificationTemplates: unknown[];
}>;
