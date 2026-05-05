import { Model, Schema, Types } from 'mongoose';
import { getUserConnection } from '../config/db';
import { LOCATION_LEVELS, type LocationLevel } from '../utils/locationInputNormalizer';

export interface IAdminBoundary {
    _id: Types.ObjectId;
    name: string;
    level: LocationLevel;
    locationId: Types.ObjectId;
    geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: number[][][] | number[][][][];
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const AdminBoundarySchema = new Schema<IAdminBoundary>(
    {
        name: { type: String, required: true, trim: true },
        level: {
            type: String,
            required: true,
            enum: LOCATION_LEVELS
        },
        locationId: {
            type: Schema.Types.ObjectId,
            ref: 'Location',
            required: true
        },
        geometry: {
            type: {
                type: String,
                required: true,
                enum: ['Polygon', 'MultiPolygon']
            },
            coordinates: {
                type: Schema.Types.Mixed,
                required: true
            }
        }
    },
    {
        timestamps: true
    }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AdminBoundarySchema.index({ level: 1 }, { name: 'idx_adminboundary_level_idx' });
AdminBoundarySchema.index({ locationId: 1 }, { name: 'idx_adminboundary_locationId_idx' });
AdminBoundarySchema.index({ geometry: '2dsphere' }, { name: 'idx_adminboundary_geo_2dsphere' });
AdminBoundarySchema.index({ locationId: 1, level: 1 }, { name: 'idx_adminboundary_location_level_unique_idx', unique: true });

const connection = getUserConnection();

const AdminBoundary: Model<IAdminBoundary> =
    (connection.models.AdminBoundary as Model<IAdminBoundary> | undefined) ||
    connection.model<IAdminBoundary>('AdminBoundary', AdminBoundarySchema);

export default AdminBoundary;
