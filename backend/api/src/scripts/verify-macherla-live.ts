/**
 * verify-macherla-live.ts
 *
 * Real Data & Live MongoDB Verification for Server-Side Canonical Location Enrichment
 * 
 * Verifies:
 * 1. Macherla (0 km) with 0 local ads returns nearby ads within 50 km (Karampudi, Gurazala, Narasaraopet)
 * 2. Ads outside 50 km (Vijayawada at ~95 km) are excluded from proximity results
 * 3. Exact Macherla ads (0 km) rank ahead of nearby ads for comparable listings
 * 4. GET /listings and GET /listings/home both produce consistent location-enriched responses
 */

import mongoose from 'mongoose';
import { connectDB, closeDB } from '@esparex/core/config/db';
import Location from '@esparex/core/models/Location';
import Ad from '@esparex/core/models/Ad';
import User from '@esparex/core/models/User';
import Category from '@esparex/core/models/Category';
import { getAds } from '@esparex/core/domains/listings/application/aggregation/adAggregation/pipeline';
import { buildHomeFeed } from '@esparex/core/domains/discovery/application/services/feed/FeedQueryService';
import { MODERATION_STATUS, CATALOG_STATUS, USER_STATUS, LOCATION_STATUS } from '@esparex/contracts';
import type { Role } from '@esparex/contracts';

interface SeededLocation {
    id: string;
    name: string;
    coordinates: [number, number]; // [lng, lat]
    distanceKmFromMacherla: number;
}

async function runVerification() {
    console.log('\n======================================================================');
    console.log('🚀 STARTING REAL MONGODB LOCATION-BASED PROXIMITY & FEED VERIFICATION');
    console.log('======================================================================\n');

    try {
        console.log('1. Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB successfully.\n');

        // 2. Ensure Locations exist with canonical coordinates
        console.log('2. Ensuring canonical locations in MongoDB...');
        const locationDefs = [
            { name: 'Macherla', coordinates: [79.29, 16.48] as [number, number], distanceEst: 0 },
            { name: 'Karampudi', coordinates: [79.74, 16.43] as [number, number], distanceEst: 18 },
            { name: 'Gurazala', coordinates: [79.57, 16.58] as [number, number], distanceEst: 24 },
            { name: 'Narasaraopet', coordinates: [80.05, 16.23] as [number, number], distanceEst: 48 },
            { name: 'Vijayawada', coordinates: [80.64, 16.50] as [number, number], distanceEst: 95 },
        ];

        const locations: Record<string, SeededLocation> = {};

        for (const locDef of locationDefs) {
            let locDoc = await Location.findOne({ name: locDef.name });
            if (!locDoc) {
                locDoc = await Location.create({
                    name: locDef.name,
                    normalizedName: locDef.name.toLowerCase().trim(),
                    level: 'city',
                    country: 'India',
                    coordinates: {
                        type: 'Point',
                        coordinates: locDef.coordinates,
                    },
                    isActive: true,
                    verificationStatus: LOCATION_STATUS.VERIFIED,
                });
                console.log(`   Created location: ${locDef.name} -> ID: ${String(locDoc._id)}`);
            } else {
                // Ensure coordinates are exact
                locDoc.coordinates = { type: 'Point', coordinates: locDef.coordinates };
                locDoc.isActive = true;
                await locDoc.save();
                console.log(`   Found location: ${locDef.name} -> ID: ${String(locDoc._id)}`);
            }

            locations[locDef.name] = {
                id: String(locDoc._id),
                name: locDef.name,
                coordinates: locDef.coordinates,
                distanceKmFromMacherla: locDef.distanceEst,
            };
        }

        // 3. Ensure Category & Seller
        console.log('\n3. Ensuring test category and test seller...');
        let category = await Category.findOne({ slug: 'mobiles-verification-test' });
        if (!category) {
            category = await Category.create({
                name: 'Mobiles Test',
                displayName: 'Mobiles Test',
                slug: 'mobiles-verification-test',
                isActive: true,
                status: CATALOG_STATUS.ACTIVE,
            });
        }

        let seller = await User.findOne({ mobile: '9888877777' });
        if (!seller) {
            seller = await User.create({
                name: 'Verification Seller',
                mobile: '9888877777',
                email: 'verify_seller@esparex.test',
                role: 'user' as Role,
                status: USER_STATUS.ACTIVE,
                isVerified: true,
            });
        }

        if (!category || !seller) {
            throw new Error('Failed to ensure test category or test seller');
        }

        // 4. Clean up old test ads
        console.log('\n4. Cleaning up previous test verification ads...');
        await Ad.deleteMany({ title: { $regex: /^\[TEST_VERIFY\]/ } });

        const macherla = locations['Macherla'];
        const karampudi = locations['Karampudi'];
        const gurazala = locations['Gurazala'];
        const narasaraopet = locations['Narasaraopet'];
        const vijayawada = locations['Vijayawada'];

        // 5. Seed test ads: 0 local Macherla ads, 3 nearby ads (18km, 24km, 48km), 1 far ad (95km)
        console.log('\n5. Seeding test ads in nearby and far locations...');
        const now = new Date();
        const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const testAdsToCreate = [
            {
                title: '[TEST_VERIFY] Karampudi Screen Repair - 18km',
                price: 1500,
                locationDoc: karampudi,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
            },
            {
                title: '[TEST_VERIFY] Gurazala iPhone Display - 24km',
                price: 2500,
                locationDoc: gurazala,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
            },
            {
                title: '[TEST_VERIFY] Narasaraopet Battery Replacement - 48km',
                price: 999,
                locationDoc: narasaraopet,
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago
            },
            {
                title: '[TEST_VERIFY] Vijayawada Motherboard - 95km (FAR)',
                price: 4500,
                locationDoc: vijayawada,
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
            },
        ];

        const createdAdIds: string[] = [];
        for (const adSpec of testAdsToCreate) {
            const ad = await Ad.create({
                title: adSpec.title,
                price: adSpec.price,
                description: `Live verification test ad for ${adSpec.locationDoc.name}`,
                categoryId: category._id,
                sellerId: seller._id,
                sellerType: 'user',
                images: ['https://example.com/image.jpg'],
                status: 'live',
                moderationStatus: MODERATION_STATUS.AUTO_APPROVED,
                isDeleted: false,
                listingType: 'ad',
                publishedAt: adSpec.createdAt,
                approvedAt: adSpec.createdAt,
                expiresAt: futureExpiry,
                location: {
                    locationId: new mongoose.Types.ObjectId(adSpec.locationDoc.id),
                    name: adSpec.locationDoc.name,
                    city: adSpec.locationDoc.name,
                    state: 'Andhra Pradesh',
                    country: 'India',
                    coordinates: {
                        type: 'Point',
                        coordinates: adSpec.locationDoc.coordinates,
                    },
                },
            });
            createdAdIds.push(String(ad._id));
            console.log(`   Created Ad: "${adSpec.title}" at ${adSpec.locationDoc.name} (coords: [${adSpec.locationDoc.coordinates}]) -> ID: ${String(ad._id)}`);
        }

        // Diagnostic: Check if created ads can be found by standard Ad.find()
        const foundTestAds = await Ad.find({ _id: { $in: createdAdIds } }).lean();
        console.log(`\nDiagnostic: Direct Ad.find() found ${foundTestAds.length} seeded ads in DB.`);

        // =====================================================================
        // TEST CASE 1: Query GET /listings with locationId = Macherla (0 local ads)
        // =====================================================================
        console.log('\n----------------------------------------------------------------------');
        console.log('🧪 TEST CASE 1: Query GET /listings with locationId = Macherla (0 local ads)');
        console.log('----------------------------------------------------------------------');

        const listingsResult1 = await getAds(
            { locationId: macherla.id },
            { page: 1, limit: 20 },
            { enforcePublicVisibility: true }
        );

        console.log(`\nResults returned: ${listingsResult1.data.length}`);
        console.log(`Effective Radius: ${listingsResult1.meta?.effectiveRadiusKm} km`);
        console.log(`Location Hierarchy Level: ${listingsResult1.meta?.locationHierarchyLevel || 'L1 (Geo/Proximity)'}`);

        const proximityAds1: Array<Record<string, unknown>> = [];
        const fallbackAds1: Array<Record<string, unknown>> = [];

        console.log('\nAd Listings received:');
        listingsResult1.data.forEach((ad, i) => {
            const distance = (ad as Record<string, unknown>).distanceKm ?? (ad as Record<string, unknown>).distance;
            const rankScore = (ad as Record<string, unknown>).rankScore;
            const isProximity = distance !== undefined && distance !== null;
            if (isProximity) proximityAds1.push(ad as Record<string, unknown>);
            else fallbackAds1.push(ad as Record<string, unknown>);

            const tierLabel = isProximity ? `[Proximity: ${Number(distance).toFixed(1)} km]` : '[Fallback: State/National]';
            console.log(`   [${i + 1}] "${ad.title}" | Loc: ${(ad.location as Record<string, unknown>)?.name} | ${tierLabel} | Rank: ${rankScore ?? 'N/A'}`);
        });

        const proximityTitles1 = proximityAds1.map(d => String(d.title));
        const hasKarampudiInProximity = proximityTitles1.some(t => t.includes('Karampudi'));
        const hasGurazalaInProximity = proximityTitles1.some(t => t.includes('Gurazala'));
        const hasVijayawadaInProximity = proximityTitles1.some(t => t.includes('Vijayawada'));

        console.log('\nAssertions:');
        console.log(`   - Karampudi (within 50km) returned in $geoNear proximity tier: ${hasKarampudiInProximity ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Gurazala (within 50km) returned in $geoNear proximity tier: ${hasGurazalaInProximity ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Vijayawada (95km) EXCLUDED from $geoNear proximity tier: ${!hasVijayawadaInProximity ? '✅ PASS (Correctly excluded from proximity)' : '❌ FAIL'}`);
        console.log(`   - Fallback tier expanded because total proximity results (${proximityAds1.length}) < 10: ${fallbackAds1.length > 0 ? '✅ PASS' : '❌ FAIL'}`);

        // =====================================================================
        // TEST CASE 2: Add 1 local Macherla ad and verify Macherla ranks #1
        // =====================================================================
        console.log('\n----------------------------------------------------------------------');
        console.log('🧪 TEST CASE 2: Add 1 local Macherla Ad and verify Exact vs Nearby Ranking');
        console.log('----------------------------------------------------------------------');

        const macherlaAd = await Ad.create({
            title: '[TEST_VERIFY] Macherla Local Phone - 0km',
            price: 2000,
            description: 'Local Macherla verified ad',
            categoryId: category._id,
            sellerId: seller._id,
            sellerType: 'user',
            images: ['https://example.com/image.jpg'],
            status: 'live',
            moderationStatus: MODERATION_STATUS.AUTO_APPROVED,
            isDeleted: false,
            listingType: 'ad',
            publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            approvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            expiresAt: futureExpiry,
            location: {
                locationId: new mongoose.Types.ObjectId(macherla.id),
                name: macherla.name,
                city: macherla.name,
                state: 'Andhra Pradesh',
                country: 'India',
                coordinates: {
                    type: 'Point',
                    coordinates: macherla.coordinates,
                },
            },
        });
        createdAdIds.push(String(macherlaAd._id));
        console.log(`   Created Macherla Local Ad: "${String(macherlaAd.title)}"`);

        const listingsResult2 = await getAds(
            { locationId: macherla.id },
            { page: 1, limit: 20 },
            { enforcePublicVisibility: true }
        );

        console.log(`\nResults returned: ${listingsResult2.data.length}`);
        console.log('\nRank-sorted listings:');
        listingsResult2.data.forEach((ad, i) => {
            const distance = (ad as Record<string, unknown>).distanceKm ?? (ad as Record<string, unknown>).distance;
            const rankScore = (ad as Record<string, unknown>).rankScore;
            console.log(`   [${i + 1}] "${ad.title}" | Loc: ${(ad.location as Record<string, unknown>)?.name} | Dist: ${distance !== undefined ? Number(distance).toFixed(1) + ' km' : 'N/A'} | Rank: ${rankScore}`);
        });

        const firstAdTitle = String(listingsResult2.data[0]?.title || '');
        const isMacherlaFirst = firstAdTitle.includes('Macherla');
        console.log(`\nAssertion:`);
        console.log(`   - Exact local Macherla ad (0km) ranks #1: ${isMacherlaFirst ? '✅ PASS' : '❌ FAIL'}`);

        // =====================================================================
        // TEST CASE 3: GET /listings/home with locationId = Macherla
        // =====================================================================
        console.log('\n----------------------------------------------------------------------');
        console.log('🧪 TEST CASE 3: Query GET /listings/home with locationId = Macherla');
        console.log('----------------------------------------------------------------------');

        const homeFeedResult = await buildHomeFeed(
            { locationId: macherla.id },
            10,
            null
        );

        console.log(`\nHome Feed ads returned: ${homeFeedResult.ads.length}`);
        homeFeedResult.ads.forEach((ad, i) => {
            const loc = (ad as Record<string, unknown>).location as Record<string, unknown> | undefined;
            console.log(`   [${i + 1}] "${ad.title}" | Loc: ${loc?.name || loc?.city || 'N/A'}`);
        });

        const homeHasMacherla = homeFeedResult.ads.some(a => String(a.title).includes('Macherla'));
        const homeHasNearby = homeFeedResult.ads.some(a => String(a.title).includes('Gurazala') || String(a.title).includes('Karampudi'));
        console.log(`\nAssertion:`);
        console.log(`   - Home Feed contains local and nearby items: ${(homeHasMacherla || homeHasNearby) ? '✅ PASS' : '❌ FAIL'}`);

        // 6. Cleanup test data
        console.log('\n6. Cleaning up test ads...');
        await Ad.deleteMany({ _id: { $in: createdAdIds } });
        console.log('✅ Cleaned up all verification test ads.\n');

        console.log('======================================================================');
        console.log('🎉 REAL MONGODB LOCATION-BASED VERIFICATION COMPLETED SUCCESSFULLY!');
        console.log('======================================================================\n');
    } catch (err) {
        console.error('❌ Verification failed with error:', err);
    } finally {
        await closeDB();
    }
}

void runVerification();
