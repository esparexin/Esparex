/**
 * Esparex Daily Marketplace Activity Engine - Canonical Domain Executor
 * Executes validated manifest records exclusively via canonical application services.
 */

import { Connection } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
    DailyManifestInput,
    ValidationItemResult
} from './marketplace-types';

export interface ExecutionContext {
    userConn: Connection;
    adminConn: Connection;
    curatorUserId: string;
}

export interface ExecutionResults {
    createdCounts: {
        ads: number;
        businesses: number;
        services: number;
        spareParts: number;
        smartAlerts: number;
        total: number;
    };
    createdIds: Array<{ code: string; type: string; id: string }>;
}

export async function executeValidatedManifest(
    manifest: DailyManifestInput,
    validationResults: ValidationItemResult[],
    ctx: ExecutionContext
): Promise<ExecutionResults> {
    const { AuthService } = await import('../../core/src/domains/identity/application/auth/AuthService');
    const { registerBusiness } = await import('../../core/src/services/business/BusinessCoreService');
    const { approveBusiness } = await import('../../core/src/services/business/BusinessLifecycleService');
    const { assignDefaultPlan } = await import('../../core/src/services/business/BusinessSubscriptionService');
    const { createAd } = await import('../../core/src/domains/listings/application/ad/AdOrchestrator');
    const { createSmartAlertMutation } = await import('../../core/src/domains/notifications/application/SmartAlertMutationService');
    const { LISTING_TYPE } = await import('@esparex/contracts');

    const validCodes = new Set(validationResults.filter(r => r.isValid).map(r => r.code));
    const bizIdMap = new Map<string, { bizId: string; userId: string }>();
    const createdIds: Array<{ code: string; type: string; id: string }> = [];

    // 1. Create Verified Businesses (with decoupled authorized curator sessions)
    for (let idx = 0; idx < manifest.businesses.length; idx++) {
        const biz = manifest.businesses[idx];
        if (!validCodes.has(biz.code)) continue;

        const validation = validationResults.find(r => r.code === biz.code);
        let bizId: string;
        let bizUserId: string;

        const existingBiz = await ctx.userConn.collection('businesses').findOne({ mobile: biz.publicMobile, isDeleted: false });
        if (existingBiz) {
            bizId = existingBiz._id.toString();
            bizUserId = existingBiz.userId.toString();
        } else {
            const bizCuratorMobile = `98481${String(idx + 1).padStart(5, '0')}`;
            await AuthService.sendLoginOtp(bizCuratorMobile);
            const auth = await AuthService.verifyLoginOtp(bizCuratorMobile, '123456', `Esparex Curator - ${biz.city}`);
            bizUserId = String((auth.user as { _id?: unknown; id?: unknown })._id || (auth.user as { id?: unknown }).id);

            const registered = await registerBusiness({
                name: biz.name,
                description: `${biz.name} - Verified workshop in ${biz.city}, ${biz.state}. Reference: ${biz.referenceSource}`,
                mobile: biz.publicMobile,
                email: `contact.${biz.code.toLowerCase()}@esparex.in`,
                businessTypes: ['repair_service', 'spare_parts_dealer'],
                address: biz.address,
                locationId: validation?.resolvedLocationId,
                location: {
                    address: biz.address,
                    city: biz.city,
                    state: biz.state,
                    country: 'India',
                    pincode: biz.pincode,
                    locationId: validation?.resolvedLocationId,
                    coordinates: validation?.resolvedCoordinates ? {
                        type: 'Point',
                        coordinates: validation.resolvedCoordinates
                    } : undefined
                },
                images: biz.images,
            }, bizUserId);

            bizId = String(registered._id);
            await approveBusiness(bizId, 'SYSTEM');
            await assignDefaultPlan(bizUserId);
        }

        bizIdMap.set(biz.code, { bizId, userId: bizUserId });
        createdIds.push({ code: biz.code, type: 'business', id: bizId });
    }

    // 2. Create Services (linked to verified business)
    for (const svc of manifest.services) {
        if (!validCodes.has(svc.code)) continue;
        const bizInfo = bizIdMap.get(svc.businessCode);
        if (!bizInfo) continue;

        const existingService = await ctx.userConn.collection('ads').findOne({
            businessId: new ObjectId(bizInfo.bizId),
            listingType: LISTING_TYPE.SERVICE,
            isDeleted: false
        });
        if (existingService) {
            createdIds.push({ code: svc.code, type: 'service', id: existingService._id.toString() });
            continue;
        }

        const biz = await ctx.userConn.collection('businesses').findOne({ _id: new ObjectId(bizInfo.bizId) });
        if (!biz) continue;

        const createdService = await createAd({
            listingType: LISTING_TYPE.SERVICE,
            title: svc.title,
            description: svc.description,
            price: svc.priceMin,
            priceMin: svc.priceMin,
            priceMax: svc.priceMax,
            diagnosticFee: svc.diagnosticFee,
            categoryId: svc.categoryId,
            serviceTypeIds: [svc.serviceTypeId],
            businessId: bizInfo.bizId,
            sellerType: 'business',
            images: svc.images,
            location: {
                ...(biz.location as Record<string, unknown>),
                locationId: biz.locationId?.toString()
            },
            locationId: biz.locationId?.toString(),
            business: biz
        }, {
            actor: 'USER',
            authUserId: bizInfo.userId,
            sellerId: bizInfo.userId,
            business: biz as unknown as import('../../core/src/types/ad.types').AdContext['business']
        });

        if (createdService) {
            createdIds.push({ code: svc.code, type: 'service', id: String(createdService.id || (createdService as { _id?: string })._id) });
        }
    }

    // 3. Create Spare Parts (linked to verified business)
    for (const part of manifest.spareParts) {
        if (!validCodes.has(part.code)) continue;
        const bizInfo = bizIdMap.get(part.businessCode);
        if (!bizInfo) continue;

        const existingPart = await ctx.userConn.collection('ads').findOne({
            businessId: new ObjectId(bizInfo.bizId),
            listingType: LISTING_TYPE.SPARE_PART,
            isDeleted: false
        });
        if (existingPart) {
            createdIds.push({ code: part.code, type: 'spare_part', id: existingPart._id.toString() });
            continue;
        }

        const biz = await ctx.userConn.collection('businesses').findOne({ _id: new ObjectId(bizInfo.bizId) });
        if (!biz) continue;

        const createdPart = await createAd({
            listingType: LISTING_TYPE.SPARE_PART,
            title: part.title,
            description: part.description,
            price: part.price,
            categoryId: part.categoryId,
            sparePartId: part.sparePartId,
            businessId: bizInfo.bizId,
            sellerType: 'business',
            images: part.images,
            location: {
                ...(biz.location as Record<string, unknown>),
                locationId: biz.locationId?.toString()
            },
            locationId: biz.locationId?.toString(),
            business: biz
        }, {
            actor: 'USER',
            authUserId: bizInfo.userId,
            sellerId: bizInfo.userId,
            business: biz as unknown as import('../../core/src/types/ad.types').AdContext['business']
        });

        if (createdPart) {
            createdIds.push({ code: part.code, type: 'spare_part', id: String(createdPart.id || (createdPart as { _id?: string })._id) });
        }
    }

    // 4. Create Classified Ads (partitioned across seller accounts to respect 5-ad free quota)
    for (let i = 0; i < manifest.ads.length; i++) {
        const ad = manifest.ads[i];
        if (!validCodes.has(ad.code)) continue;
        const validation = validationResults.find(r => r.code === ad.code);

        const existingAd = await ctx.userConn.collection('ads').findOne({
            title: ad.title,
            listingType: LISTING_TYPE.AD,
            isDeleted: false
        });
        if (existingAd) {
            createdIds.push({ code: ad.code, type: 'ad', id: existingAd._id.toString() });
            continue;
        }

        let adSellerId = ctx.curatorUserId;
        if (i >= 5) {
            const bizInfo = Array.from(bizIdMap.values())[i % bizIdMap.size];
            if (bizInfo) adSellerId = bizInfo.userId;
        }

        const createdAd = await createAd({
            listingType: LISTING_TYPE.AD,
            title: ad.title,
            description: ad.description,
            price: ad.price,
            categoryId: ad.categoryId,
            brandId: ad.brandId,
            modelId: ad.modelId,
            deviceCondition: ad.deviceCondition,
            images: ad.images,
            location: {
                name: ad.locationName,
                display: ad.locationName,
                city: ad.locationName,
                state: ad.state,
                country: 'India',
                locationId: validation?.resolvedLocationId,
                coordinates: validation?.resolvedCoordinates ? {
                    type: 'Point',
                    coordinates: validation.resolvedCoordinates
                } : undefined
            },
            locationId: validation?.resolvedLocationId
        }, {
            actor: 'USER',
            authUserId: adSellerId,
            sellerId: adSellerId
        });

        if (createdAd) {
            createdIds.push({ code: ad.code, type: 'ad', id: String(createdAd.id || (createdAd as { _id?: string })._id) });
        }
    }

    // 5. Create Smart Alerts (partitioned across curator sessions to respect free tier quota)
    for (let i = 0; i < manifest.smartAlerts.length; i++) {
        const alert = manifest.smartAlerts[i];
        if (!validCodes.has(alert.code)) continue;
        const validation = validationResults.find(r => r.code === alert.code);

        const existingAlert = await ctx.userConn.collection('smartalerts').findOne({
            name: alert.name,
            isActive: true
        });
        if (existingAlert) {
            createdIds.push({ code: alert.code, type: 'smart_alert', id: existingAlert._id.toString() });
            continue;
        }

        let alertUserId = ctx.curatorUserId;
        if (i >= 5) {
            const bizInfo = Array.from(bizIdMap.values())[i % bizIdMap.size];
            if (bizInfo) alertUserId = bizInfo.userId;
        }

        const createdAlert = await createSmartAlertMutation({
            user: { id: alertUserId },
            body: {
                name: alert.name,
                radiusKm: alert.radiusKm,
                coordinates: validation?.resolvedCoordinates ? {
                    type: 'Point',
                    coordinates: validation.resolvedCoordinates
                } : undefined,
                criteria: {
                    categoryId: alert.categoryId,
                    brandId: alert.brandId,
                    location: alert.locationName,
                    state: alert.state,
                    locationId: validation?.resolvedLocationId
                }
            }
        });

        if (createdAlert) {
            createdIds.push({ code: alert.code, type: 'smart_alert', id: String(createdAlert._id) });
        }
    }

    const createdCounts = {
        businesses: createdIds.filter(i => i.type === 'business').length,
        services: createdIds.filter(i => i.type === 'service').length,
        spareParts: createdIds.filter(i => i.type === 'spare_part').length,
        ads: createdIds.filter(i => i.type === 'ad').length,
        smartAlerts: createdIds.filter(i => i.type === 'smart_alert').length,
        total: createdIds.length
    };

    return { createdCounts, createdIds };
}
