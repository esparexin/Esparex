import { Schema, Document, Model } from 'mongoose';
import { getAdminConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface ISystemConfig extends Document {
    singletonKey?: string;
    ai: {
        moderation: {
            enabled: boolean;
            autoFlag: boolean;
            autoBlock: boolean;
            confidenceThreshold: number;
            /** Number of community reports required to auto-hide an ad. */
            reportAutoHideThreshold: number;
            thresholds: {
                scamDetection: number;
                inappropriateContent: number;
                spamDetection: number;
                counterfeits: number;
                prohibitedItems: number;
            };
        };
        seo: {
            enableTitleSEO: boolean;
            enableDescriptionSEO: boolean;
            titleProvider: 'openai' | 'local' | 'custom';
            descriptionProvider: 'openai' | 'local' | 'custom';
            openaiApiKey?: string;
            customApiEndpoint?: string;
            model?: string; // e.g. 'gpt-4o'
            temperature?: number;
            maxTokens?: number;
        };
    };
    platform: {
        maintenance: {
            enabled: boolean;
            message: string;
            allowedIps: string[];
            scheduledEnd?: Date;
            bypassToken?: string;
        };
        branding: {
            platformName: string;
            tagline: string;
            primaryColor: string;
            secondaryColor: string;
            logoUrl: string;
            faviconUrl: string;
        };
    };
    security: {
        twoFactor: {
            enabled: boolean;
            issuer: string;
        };
        sessionTimeoutMinutes: number;
        ipWhitelist: string[];
        maxLoginAttempts: number;
    };
    notifications: {
        email: {
            enabled: boolean;
            provider: 'smtp' | 'sendgrid' | 'aws-ses';
            senderName: string;
            senderEmail: string;
            // SMTP Settings
            host?: string;
            port?: number;
            username?: string;
            password?: string;
            encryption?: 'none' | 'ssl' | 'tls';
        };
        push: {
            enabled: boolean;
            provider: 'firebase' | 'onesignal';
        };
    };
    location: {
        radiusKm: number;
        enableGeolocation: boolean;
        defaultCenter: {
            type: 'Point',
            coordinates: [number, number]
        };
        mapProvider: 'google' | 'mapbox' | 'openstreetmap';
        mapboxAccessToken?: string;
        distanceUnit: 'km' | 'miles';
        defaultSearchRadius: number;
        maxSearchRadius: number;
        geocodingProvider: 'google' | 'mapbox' | 'nominatim';
        enableReverseGeocoding: boolean;
        enableAutoComplete: boolean;
        autoCompleteMinChars: number;
        requireLocationVerification: boolean;
        autoApproveHighConfidence: boolean;
        confidenceThreshold: number;
        showExactCoordinates: boolean;
        blurLocationRadius: number;
        allowGpsTracking: boolean;
        enableGeofencing: boolean;
        enableLocationHistory: boolean;
        enableNearbySearch: boolean;
        showDistanceInListings: boolean;
    };
    integrations: {
        googleMaps: {
            apiKey: string;
            enabled: boolean;
        };
        sms: {
            provider: string;
            apiKey: string;
            apiSecret: string;
            senderId: string;
            rateLimit: number;
        };
        payment: {
            razorpay: {
                enabled: boolean;
                keyId: string;
                keySecret: string;
            };
            stripe: {
                enabled: boolean;
                publishableKey: string;
                secretKey: string;
            };
        };
    };
    listing: {
        expiryDays: {
            ad: number;
            service: number;
            spare_part: number;
        };
        thresholds: {
            proSparePartLimit: number;
        };
    };
    emailTemplates?: unknown[];
    notificationTemplates?: unknown[];
    updatedBy?: string; // Admin ID
    updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
    singletonKey: { type: String, default: 'global' },
    ai: {
        moderation: {
            enabled: { type: Boolean, default: true },
            autoFlag: { type: Boolean, default: true },
            autoBlock: { type: Boolean, default: false },
            confidenceThreshold: { type: Number, default: 85 },
            reportAutoHideThreshold: { type: Number, default: 5, min: 1 },
            thresholds: {
                scamDetection: { type: Number, default: 75 },
                inappropriateContent: { type: Number, default: 80 },
                spamDetection: { type: Number, default: 70 },
                counterfeits: { type: Number, default: 85 },
                prohibitedItems: { type: Number, default: 90 },
            }
        },
        seo: {
            enableTitleSEO: { type: Boolean, default: true },
            enableDescriptionSEO: { type: Boolean, default: true },
            titleProvider: { type: String, enum: ['openai', 'local', 'custom'], default: 'openai' },
            descriptionProvider: { type: String, enum: ['openai', 'local', 'custom'], default: 'openai' },
            openaiApiKey: { type: String },
            customApiEndpoint: { type: String },
            model: { type: String, default: 'gpt-4o' },
            temperature: { type: Number, default: 0.7 },
            maxTokens: { type: Number, default: 500 }
        },
    },
    security: {
        twoFactor: {
            enabled: { type: Boolean, default: false },
            issuer: { type: String, default: 'Esparex Admin' },
        },
        sessionTimeoutMinutes: { type: Number, default: 60 },
        ipWhitelist: [{ type: String }],
        maxLoginAttempts: { type: Number, default: 5 },
    },
    notifications: {
        email: {
            enabled: { type: Boolean, default: true },
            provider: { type: String, enum: ['smtp', 'sendgrid', 'aws-ses'], default: 'smtp' },
            senderName: { type: String, default: 'Esparex Team' },
            senderEmail: { type: String, default: 'noreply@esparex.com' },
            host: { type: String },
            port: { type: Number },
            username: { type: String },
            password: { type: String },
            encryption: { type: String, enum: ['none', 'ssl', 'tls'], default: 'tls' }
        },
        push: {
            enabled: { type: Boolean, default: false },
            provider: { type: String, enum: ['firebase', 'onesignal'], default: 'firebase' },
        },
    },
    platform: {
        maintenance: {
            enabled: { type: Boolean, default: false },
            message: { type: String, default: 'System is under maintenance. Please check back later.' },
            allowedIps: [{ type: String }],
            scheduledEnd: { type: Date },
            bypassToken: { type: String }
        },
        branding: {
            platformName: { type: String, default: 'Esparex' },
            tagline: { type: String, default: 'Your eco-friendly marketplace' },
            primaryColor: { type: String, default: '#0E8345' },
            secondaryColor: { type: String, default: '#0d7a40' },
            logoUrl: { type: String },
            faviconUrl: { type: String }
        }
    },

    location: {
        radiusKm: { type: Number, default: 50 },
        enableGeolocation: { type: Boolean, default: true },
        defaultCenter: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        },
        mapProvider: { type: String, enum: ['google', 'mapbox', 'openstreetmap'], default: 'google' },
        mapboxAccessToken: { type: String },
        distanceUnit: { type: String, enum: ['km', 'miles'], default: 'km' },
        defaultSearchRadius: { type: Number, default: 25 },
        maxSearchRadius: { type: Number, default: 100 },
        geocodingProvider: { type: String, enum: ['google', 'mapbox', 'nominatim'], default: 'google' },
        enableReverseGeocoding: { type: Boolean, default: true },
        enableAutoComplete: { type: Boolean, default: true },
        autoCompleteMinChars: { type: Number, default: 3 },
        requireLocationVerification: { type: Boolean, default: true },
        autoApproveHighConfidence: { type: Boolean, default: true },
        confidenceThreshold: { type: Number, default: 85 },
        showExactCoordinates: { type: Boolean, default: false },
        blurLocationRadius: { type: Number, default: 500 },
        allowGpsTracking: { type: Boolean, default: true },
        enableGeofencing: { type: Boolean, default: true },
        enableLocationHistory: { type: Boolean, default: true },
        enableNearbySearch: { type: Boolean, default: true },
        showDistanceInListings: { type: Boolean, default: true }
    },
    integrations: {
        googleMaps: {
            apiKey: { type: String },
            enabled: { type: Boolean, default: false }
        },
        sms: {
            provider: { type: String, default: 'twilio' },
            apiKey: { type: String },
            apiSecret: { type: String },
            senderId: { type: String },
            rateLimit: { type: Number, default: 5 }
        },
        payment: {
            razorpay: {
                enabled: { type: Boolean, default: false },
                keyId: { type: String },
                keySecret: { type: String }
            },
            stripe: {
                enabled: { type: Boolean, default: false },
                publishableKey: { type: String },
                secretKey: { type: String }
            }
        }
    },
    listing: {
        expiryDays: {
            ad: { type: Number, default: 30 },
            service: { type: Number, default: 90 },
            spare_part: { type: Number, default: 60 },
        },
        thresholds: {
            proSparePartLimit: { type: Number, default: 5 },
        }
    },
    emailTemplates: [{ type: Schema.Types.Mixed }],
    notificationTemplates: [{ type: Schema.Types.Mixed }],
    updatedBy: { type: String },
}, {
    collection: 'system_configs'
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

SystemConfigSchema.index({ singletonKey: 1 }, { name: 'idx_systemconfig_singletonKey_unique_idx', unique: true });

const connection = getAdminConnection();
const SystemConfig: Model<ISystemConfig> =
    (connection.models.SystemConfig as Model<ISystemConfig>) ||
    connection.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

applyToJSONTransform(SystemConfigSchema);

export default SystemConfig;
