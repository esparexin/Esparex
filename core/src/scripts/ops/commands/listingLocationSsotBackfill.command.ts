import mongoose from 'mongoose';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../../../types';
import { connectOpsDb } from './commandUtils';
import { closeDB } from '../../../config/db';

export const listingLocationSsotBackfillCommand: OpsCommand = {
    name: 'listing-location-ssot-backfill',
    description: 'Backfills missing locationId in Ad and Business collections using GeoJSON coordinates SSOT.',
    blastRadius: 'medium',

    run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
        const isDryRun = !context.flags.apply;
        const db = await connectOpsDb();
        if (!db) throw new Error('DB handle not available');

        const ads = db.collection('ads');
        const businesses = db.collection('businesses');
        const services = db.collection('services');
        const locations = db.collection('locations');
        const locationEvents = db.collection('locationevents');

        const stats = {
            ads: { total: 0, backfilled: 0, purged: 0 },
            businesses: { total: 0, backfilled: 0, purged: 0 },
            services: { total: 0, backfilled: 0, purged: 0 },
            locationEvents: { total: 0, backfilled: 0, purged: 0 },
        };

        const backfillCollection = async (coll: mongoose.mongo.Collection, type: 'ads' | 'businesses' | 'services') => {
            const query = {
                $and: [
                    {
                        $or: [
                            { locationId: { $exists: false } },
                            { locationId: null },
                            { 'location.locationId': { $exists: false } },
                            { 'location.locationId': null }
                        ]
                    },
                    {
                        $or: [
                            { 'location.coordinates': { $exists: true } },
                            { 'coordinates': { $exists: true } }
                        ]
                    }
                ]
            };

            const docs = await coll.find(query).toArray();
            stats[type].total = docs.length;

            for (const doc of docs) {
                let coords = doc.location?.coordinates || doc.coordinates;
                
                // Fallback to root lat/lng for locationevents and similar
                if (!coords && typeof doc.lat === 'number' && typeof doc.lng === 'number') {
                    coords = {
                        type: 'Point',
                        coordinates: [doc.lng, doc.lat]
                    };
                }

                if (!coords || !coords.coordinates || !Array.isArray(coords.coordinates) || coords.coordinates.length !== 2) {
                    continue;
                }
                
                // Ensure coordinates are numeric
                if (typeof coords.coordinates[0] !== 'number' || typeof coords.coordinates[1] !== 'number') {
                    continue;
                }

                // Find nearest verified city/area
                const nearest = await locations.findOne({
                    coordinates: {
                        $near: {
                            $geometry: coords,
                            $maxDistance: 5000, // 5km radius
                        }
                    },
                    isActive: true,
                    level: { $in: ['city', 'area'] }
                });

                if (nearest) {
                    if (!isDryRun) {
                        await coll.updateOne(
                            { _id: doc._id },
                            {
                                $set: {
                                    locationId: nearest._id,
                                    'location.locationId': nearest._id,
                                    'location.city': nearest.city,
                                    'location.state': nearest.state,
                                    'location.country': nearest.country || 'India',
                                    'location.display': nearest.display || nearest.name,
                                },
                                // Purge legacy flat fields at root if they exist
                                $unset: {
                                    lat: '',
                                    lng: '',
                                    latitude: '',
                                    longitude: ''
                                }
                            }
                        );
                    }
                    stats[type].backfilled++;
                }
            }

            // Also purge legacy fields for documents that DO have locationId
            if (!isDryRun) {
                const purgeResult = await coll.updateMany(
                    { 
                        $or: [
                            { lat: { $exists: true } },
                            { lng: { $exists: true } },
                            { latitude: { $exists: true } },
                            { longitude: { $exists: true } }
                        ]
                    },
                    {
                        $unset: {
                            lat: '',
                            lng: '',
                            latitude: '',
                            longitude: ''
                        }
                    }
                );
                stats[type].purged = purgeResult.modifiedCount;
            }
        };

        context.emit('ops.command.listing-location-ssot-backfill.start', { mode: isDryRun ? 'DRY_RUN' : 'APPLY' });

        await backfillCollection(ads, 'ads');
        await backfillCollection(businesses, 'businesses');
        await backfillCollection(services, 'services');
        await backfillCollection(locationEvents, 'locationEvents' as any);

        context.emit('ops.command.listing-location-ssot-backfill.complete', stats);

        return {
            summary: {
                mode: isDryRun ? 'DRY_RUN' : 'APPLY',
                stats,
            },
            warnings: stats.businesses.total > stats.businesses.backfilled ? ['Some businesses could not be matched to a nearby verified location.'] : [],
            rollbackGuidance: [
                'Legacy lat/lng fields are unrecoverable once purged.',
                'Ensure database backup exists before running in APPLY mode.',
            ],
        };
    },
};
