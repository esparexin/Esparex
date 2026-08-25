import { describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import {
    sortByCreatedAtDesc,
    mergeRankedFeed,
    type FeedAdRecord,
} from '../../domains/discovery/application/services/feed/FeedRankerService';

describe('FeedRankerService', () => {
    it('sorts listings by createdAt DESC', () => {
        const ad1: FeedAdRecord = { id: '1', createdAt: new Date('2026-01-01T00:00:00Z') };
        const ad2: FeedAdRecord = { id: '2', createdAt: new Date('2026-01-02T00:00:00Z') };

        const sorted = sortByCreatedAtDesc([ad1, ad2]);
        expect(sorted.map((a) => a.id)).toEqual(['2', '1']);
    });

    it('deterministically breaks equal-timestamp ties using _id DESC', () => {
        const sameTime = new Date('2026-01-01T12:00:00.000Z');
        const idA = new mongoose.Types.ObjectId('65f0a1b2c3d4e5f607182930');
        const idB = new mongoose.Types.ObjectId('65f0a1b2c3d4e5f607182935'); // Higher hex value

        const adA: FeedAdRecord = { _id: idA, createdAt: sameTime };
        const adB: FeedAdRecord = { _id: idB, createdAt: sameTime };

        // Even if adA is passed first, adB must sort first due to higher _id hex
        const sorted = sortByCreatedAtDesc([adA, adB]);
        expect(sorted[0]._id).toEqual(idB);
        expect(sorted[1]._id).toEqual(idA);
    });

    it('enforces 30% promoted cap on feed merge', () => {
        const now = new Date();
        const spotlightAds: FeedAdRecord[] = [
            { id: 'spot-1', createdAt: now, isSpotlight: true },
            { id: 'spot-2', createdAt: now, isSpotlight: true },
            { id: 'spot-3', createdAt: now, isSpotlight: true },
            { id: 'spot-4', createdAt: now, isSpotlight: true },
        ];
        const boostedAds: FeedAdRecord[] = [];
        const organicAds: FeedAdRecord[] = Array.from({ length: 15 }, (_, i) => ({
            id: `org-${i}`,
            createdAt: now,
        }));

        // Limit = 10 -> 30% cap allows max Math.floor(10 * 0.3) = 3 promoted ads
        const result = mergeRankedFeed(spotlightAds, boostedAds, organicAds, 10);
        const promotedInResult = result.ads.filter((a) => a.isSpotlight);

        expect(promotedInResult.length).toBeLessThanOrEqual(3);
        expect(result.ads.length).toBe(10);
    });
});
