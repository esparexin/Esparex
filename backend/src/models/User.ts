import { Schema, Document, Model, Types } from 'mongoose';
import { hasValidCoordinateArray } from '@shared/utils/geoUtils';
import { getUserConnection } from '../config/db';

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IUser extends Document {
  mobile: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;

  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isVerified: boolean;

  role: 'user' | 'business' | 'admin' | 'superadmin';
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  statusChangedAt?: Date;
  statusReason?: string;

  businessId?: Types.ObjectId;

  location?: {
    coordinates?: [number, number] | GeoJSONPoint;
    locationId?: Types.ObjectId;
    city?: string;
    state?: string;
  };

  trustScore: number;
  adminBadges?: string[];
  strikeCount: number;

  failedLoginAttempts: number;
  lockUntil?: Date;
  tokenVersion: number;

  fcmTokens?: Array<{
    token: string;
    platform?: string;
    lastActive?: Date;
  }>;
  notificationSettings?: Record<string, any>;

  mobileVisibility: 'public' | 'contacts' | 'private';

  isDeleted: boolean;
  deletedAt?: Date;

  lastLoginAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;

  createdBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const toUserGeoPoint = (value: unknown): GeoJSONPoint | undefined => {
  if (value === undefined || value === null) return undefined;

  if (Array.isArray(value)) {
    if (value.length !== 2) {
      throw new Error('Invalid location.coordinates format. Expected [lng, lat].');
    }
    if (!hasValidCoordinateArray(value)) {
      throw new Error('Invalid location.coordinates values. Expected valid [lng, lat].');
    }
    return { type: 'Point', coordinates: [Number(value[0]), Number(value[1])] };
  }

  if (typeof value === 'object') {
    const node = value as { type?: unknown; coordinates?: unknown };
    if (node.type !== 'Point') {
      throw new Error('Invalid location.coordinates type. Expected GeoJSON Point.');
    }
    if (!Array.isArray(node.coordinates) || node.coordinates.length !== 2) {
      throw new Error('Invalid location.coordinates.coordinates format. Expected [lng, lat].');
    }
    if (!hasValidCoordinateArray(node.coordinates)) {
      throw new Error('Invalid location.coordinates.coordinates values. Expected valid [lng, lat].');
    }
    return {
      type: 'Point',
      coordinates: [Number(node.coordinates[0]), Number(node.coordinates[1])],
    };
  }

  throw new Error('Invalid location.coordinates format. Expected [lng, lat] or GeoJSON Point.');
};

const normalizeUserLocation = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  const location = value as Record<string, unknown>;

  if ('coordinates' in location) {
    const nextGeo = toUserGeoPoint(location.coordinates);
    if (!nextGeo) {
      delete location.coordinates;
    } else {
      location.coordinates = nextGeo;
    }
  }

  return location;
};


const UserSchema: Schema = new Schema({
  mobile: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  avatar: { type: String },

  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },

  role: {
    type: String,
    enum: ['user', 'business', 'admin', 'superadmin'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'deleted'],
    default: 'active',
  },
  statusChangedAt: { type: Date },
  statusReason: { type: String },

  businessId: { type: Schema.Types.ObjectId, ref: 'Business' },

  location: {
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (coords: unknown): boolean =>
            coords === undefined || hasValidCoordinateArray(coords),
          message: 'location.coordinates.coordinates must be a valid [lng, lat] pair.',
        },
      },
    },
    locationId: { type: Schema.Types.ObjectId },
    city: { type: String },
    state: { type: String },
  },

  trustScore: { type: Number, default: 0 },
  adminBadges: [{ type: String }],
  strikeCount: { type: Number, default: 0 },

  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  tokenVersion: { type: Number, default: 0 },

  fcmTokens: [{
    token: { type: String },
    platform: { type: String },
    lastActive: { type: Date }
  }],
  notificationSettings: { type: Schema.Types.Mixed },


  mobileVisibility: {
    type: String,
    enum: ['public', 'contacts', 'private'],
    default: 'public',
  },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },

  lastLoginAt: { type: Date, default: null },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
      const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
      json.id = json._id?.toString();
      delete json._id;
      return json;
    }
  },
  toObject: { virtuals: true, versionKey: false }
});

// Indexes
UserSchema.index({ mobile: 1 }, { unique: true, name: 'user_mobile_unique_idx' });
UserSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'user_email_unique_idx' });
UserSchema.index({ role: 1, status: 1 }, { name: 'user_role_status_idx' });
UserSchema.index({ isDeleted: 1 }, { name: 'user_deletedAt_idx' });
UserSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true, name: 'user_location_coordinates_2dsphere' });

UserSchema.pre('save', function (this: IUser) {
  this.location = normalizeUserLocation(this.location) as IUser['location'];
});

UserSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() as Record<string, unknown> | undefined;
  if (!update || Array.isArray(update)) return;

  if ('location' in update) {
    update.location = normalizeUserLocation(update.location);
  }

  if ('location.coordinates' in update) {
    const nextGeo = toUserGeoPoint(update['location.coordinates']);
    if (!nextGeo) {
      delete update['location.coordinates'];
    } else {
      update['location.coordinates'] = nextGeo;
    }
  }

  if (update.$set && typeof update.$set === 'object' && !Array.isArray(update.$set)) {
    const setObj = update.$set as Record<string, unknown>;
    if ('location' in setObj) {
      setObj.location = normalizeUserLocation(setObj.location);
    }
    if ('location.coordinates' in setObj) {
      const nextGeo = toUserGeoPoint(setObj['location.coordinates']);
      if (!nextGeo) {
        delete setObj['location.coordinates'];
      } else {
        setObj['location.coordinates'] = nextGeo;
      }
    }
  }
});

UserSchema.pre('deleteOne',
  { document: true, query: false },
  async function(this: IUser) {
    const Ad = getUserConnection().model('Ad');
    const count = await Ad.countDocuments({
      sellerId: this._id,
      status: { $in: ['pending', 'active'] }
    });
    if (count > 0) {
      throw new Error('Cannot delete user with active listings');
    }
  }
);


export const User: Model<IUser> = (getUserConnection().models.User as Model<IUser>) || getUserConnection().model<IUser>('User', UserSchema);
export default User;
