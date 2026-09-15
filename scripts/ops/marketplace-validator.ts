/**
 * Esparex Daily Marketplace Activity Engine - Pre-Flight Validator
 * Validates manifests against canonical DB, S3 image rules, and catalog SSOT.
 */

import { Connection } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
    DailyManifestInput,
    ValidationItemResult,
    DailyExecutionManifest,
    ManifestBusinessInput,
    ManifestAdInput,
    ManifestServiceInput,
    ManifestSparePartInput,
    ManifestSmartAlertInput
} from './marketplace-types';

export interface ValidationContext {
    userConn: Connection;
    adminConn: Connection;
}

const validateImages = (images: string[] | undefined): { ok: boolean; reason?: string } => {
    if (!Array.isArray(images) || images.length < 1) {
        return { ok: false, reason: `At least 1 valid image is mandatory (${images?.length || 0} provided)` };
    }
    const unique = new Set(images.map(img => img.trim().toLowerCase()));
    if (unique.size < images.length) {
        return { ok: false, reason: 'Duplicate images detected in record' };
    }
    const invalidUrl = images.find(img => !img.startsWith('https://'));
    if (invalidUrl) {
        return { ok: false, reason: `Insecure or invalid image URL: ${invalidUrl}` };
    }
    return { ok: true };
};

export async function validateBusiness(
    biz: ManifestBusinessInput,
    ctx: ValidationContext
): Promise<ValidationItemResult> {
    const imgCheck = validateImages(biz.images);
    if (!imgCheck.ok) {
        return { code: biz.code, type: 'business', nameOrTitle: biz.name, isValid: false, rejectionReason: imgCheck.reason, imageCount: biz.images?.length || 0 };
    }
    if (!biz.publicMobile || !/^[6-9]\d{9}$/.test(biz.publicMobile)) {
        return { code: biz.code, type: 'business', nameOrTitle: biz.name, isValid: false, rejectionReason: 'Invalid public business telephone number', imageCount: biz.images.length };
    }
    const loc = await ctx.userConn.collection('locations').findOne({
        state: new RegExp(`^${biz.state}$`, 'i'),
        name: new RegExp(`^${biz.city}$`, 'i'),
        isActive: true
    });
    if (!loc) {
        return { code: biz.code, type: 'business', nameOrTitle: biz.name, isValid: false, rejectionReason: `Canonical location not found for city: ${biz.city}, state: ${biz.state}`, imageCount: biz.images.length };
    }
    const cat = await ctx.adminConn.collection('categories').findOne({ _id: new ObjectId(biz.categoryId), status: 'live' });
    if (!cat) {
        return { code: biz.code, type: 'business', nameOrTitle: biz.name, isValid: false, rejectionReason: `Category ${biz.categoryId} not found or inactive in adminDB`, imageCount: biz.images.length };
    }
    return {
        code: biz.code,
        type: 'business',
        nameOrTitle: biz.name,
        isValid: true,
        resolvedLocationId: loc._id.toString(),
        resolvedCoordinates: loc.coordinates?.coordinates,
        imageCount: biz.images.length
    };
}

export async function validateAd(
    ad: ManifestAdInput,
    ctx: ValidationContext
): Promise<ValidationItemResult> {
    const imgCheck = validateImages(ad.images);
    if (!imgCheck.ok) {
        return { code: ad.code, type: 'ad', nameOrTitle: ad.title, isValid: false, rejectionReason: imgCheck.reason, imageCount: ad.images?.length || 0 };
    }
    if (!ad.description || ad.description.length < 20) {
        return { code: ad.code, type: 'ad', nameOrTitle: ad.title, isValid: false, rejectionReason: 'Description must be at least 20 characters', imageCount: ad.images.length };
    }
    const loc = await ctx.userConn.collection('locations').findOne({
        state: new RegExp(`^${ad.state}$`, 'i'),
        name: new RegExp(`^${ad.locationName}$`, 'i'),
        isActive: true
    });
    if (!loc) {
        return { code: ad.code, type: 'ad', nameOrTitle: ad.title, isValid: false, rejectionReason: `Location not found: ${ad.locationName}`, imageCount: ad.images.length };
    }
    const cat = await ctx.adminConn.collection('categories').findOne({ _id: new ObjectId(ad.categoryId), status: 'live' });
    if (!cat) {
        return { code: ad.code, type: 'ad', nameOrTitle: ad.title, isValid: false, rejectionReason: `Category ${ad.categoryId} not active`, imageCount: ad.images.length };
    }
    const brand = await ctx.adminConn.collection('brands').findOne({
        _id: new ObjectId(ad.brandId),
        categoryIds: new ObjectId(ad.categoryId),
        isActive: true,
        isDeleted: { $ne: true }
    });
    if (!brand) {
        return { code: ad.code, type: 'ad', nameOrTitle: ad.title, isValid: false, rejectionReason: `Brand ${ad.brandId} not active or not in category ${ad.categoryId}`, imageCount: ad.images.length };
    }
    if (ad.modelId) {
        const model = await ctx.adminConn.collection('models').findOne({
            _id: new ObjectId(ad.modelId),
            brandId: new ObjectId(ad.brandId),
            isActive: true,
            isDeleted: { $ne: true }
        });
        if (!model) {
            return { code: ad.code, type: 'ad', nameOrTitle: ad.title, isValid: false, rejectionReason: `Model ${ad.modelId} not active or not in brand ${ad.brandId}`, imageCount: ad.images.length };
        }
    }
    return {
        code: ad.code,
        type: 'ad',
        nameOrTitle: ad.title,
        isValid: true,
        resolvedLocationId: loc._id.toString(),
        resolvedCoordinates: loc.coordinates?.coordinates,
        imageCount: ad.images.length
    };
}

export async function validateService(
    svc: ManifestServiceInput,
    validBizCodes: Set<string>,
    ctx: ValidationContext
): Promise<ValidationItemResult> {
    const imgCheck = validateImages(svc.images);
    if (!imgCheck.ok) {
        return { code: svc.code, type: 'service', nameOrTitle: svc.title, isValid: false, rejectionReason: imgCheck.reason, imageCount: svc.images?.length || 0 };
    }
    if (!validBizCodes.has(svc.businessCode)) {
        return { code: svc.code, type: 'service', nameOrTitle: svc.title, isValid: false, rejectionReason: `Business reference ${svc.businessCode} is invalid or rejected`, imageCount: svc.images.length };
    }
    const serviceType = await ctx.adminConn.collection('servicetypes').findOne({
        _id: new ObjectId(svc.serviceTypeId),
        categoryIds: new ObjectId(svc.categoryId),
        status: 'live'
    });
    if (!serviceType) {
        return { code: svc.code, type: 'service', nameOrTitle: svc.title, isValid: false, rejectionReason: `ServiceType ${svc.serviceTypeId} does not belong to category ${svc.categoryId} or is inactive`, imageCount: svc.images.length };
    }
    return { code: svc.code, type: 'service', nameOrTitle: svc.title, isValid: true, imageCount: svc.images.length };
}

export async function validateSparePart(
    part: ManifestSparePartInput,
    validBizCodes: Set<string>,
    ctx: ValidationContext
): Promise<ValidationItemResult> {
    const imgCheck = validateImages(part.images);
    if (!imgCheck.ok) {
        return { code: part.code, type: 'spare_part', nameOrTitle: part.title, isValid: false, rejectionReason: imgCheck.reason, imageCount: part.images?.length || 0 };
    }
    if (!validBizCodes.has(part.businessCode)) {
        return { code: part.code, type: 'spare_part', nameOrTitle: part.title, isValid: false, rejectionReason: `Business reference ${part.businessCode} is invalid or rejected`, imageCount: part.images.length };
    }
    const sparePart = await ctx.adminConn.collection('spareparts').findOne({
        _id: new ObjectId(part.sparePartId),
        categoryIds: new ObjectId(part.categoryId),
        status: 'live'
    });
    if (!sparePart) {
        return { code: part.code, type: 'spare_part', nameOrTitle: part.title, isValid: false, rejectionReason: `SparePart ${part.sparePartId} does not belong to category ${part.categoryId} or is inactive`, imageCount: part.images.length };
    }
    return { code: part.code, type: 'spare_part', nameOrTitle: part.title, isValid: true, imageCount: part.images.length };
}

export async function validateSmartAlert(
    alert: ManifestSmartAlertInput,
    ctx: ValidationContext
): Promise<ValidationItemResult> {
    const loc = await ctx.userConn.collection('locations').findOne({
        state: new RegExp(`^${alert.state}$`, 'i'),
        name: new RegExp(`^${alert.locationName}$`, 'i'),
        isActive: true
    });
    if (!loc) {
        return { code: alert.code, type: 'smart_alert', nameOrTitle: alert.name, isValid: false, rejectionReason: `Location not found: ${alert.locationName}`, imageCount: 0 };
    }
    const cat = await ctx.adminConn.collection('categories').findOne({ _id: new ObjectId(alert.categoryId), status: 'live' });
    if (!cat) {
        return { code: alert.code, type: 'smart_alert', nameOrTitle: alert.name, isValid: false, rejectionReason: `Category ${alert.categoryId} not active`, imageCount: 0 };
    }
    return {
        code: alert.code,
        type: 'smart_alert',
        nameOrTitle: alert.name,
        isValid: true,
        resolvedLocationId: loc._id.toString(),
        resolvedCoordinates: loc.coordinates?.coordinates,
        imageCount: 0
    };
}

export async function validateDailyManifest(
    manifest: DailyManifestInput,
    ctx: ValidationContext
): Promise<DailyExecutionManifest> {
    const results: ValidationItemResult[] = [];
    const validBizCodes = new Set<string>();

    for (const biz of manifest.businesses) {
        const res = await validateBusiness(biz, ctx);
        results.push(res);
        if (res.isValid) validBizCodes.add(biz.code);
    }
    for (const ad of manifest.ads) {
        results.push(await validateAd(ad, ctx));
    }
    for (const svc of manifest.services) {
        results.push(await validateService(svc, validBizCodes, ctx));
    }
    for (const part of manifest.spareParts) {
        results.push(await validateSparePart(part, validBizCodes, ctx));
    }
    for (const alert of manifest.smartAlerts) {
        results.push(await validateSmartAlert(alert, ctx));
    }

    const countByType = (type: string, valid: boolean) =>
        results.filter(r => r.type === type && r.isValid === valid).length;

    const vAds = countByType('ad', true);
    const vBiz = countByType('business', true);
    const vSvc = countByType('service', true);
    const vParts = countByType('spare_part', true);
    const vAlerts = countByType('smart_alert', true);

    const rAds = countByType('ad', false);
    const rBiz = countByType('business', false);
    const rSvc = countByType('service', false);
    const rParts = countByType('spare_part', false);
    const rAlerts = countByType('smart_alert', false);

    const reasons = results.filter(r => !r.isValid).map(r => `[${r.type.toUpperCase()}:${r.code}] ${r.rejectionReason}`);

    return {
        date: manifest.date,
        environment: manifest.environment,
        targets: { ads: 100, businesses: 50, services: 50, spareParts: 50, smartAlerts: 25, total: 275 },
        verified: { ads: vAds, businesses: vBiz, services: vSvc, spareParts: vParts, smartAlerts: vAlerts, total: vAds + vBiz + vSvc + vParts + vAlerts },
        rejected: { ads: rAds, businesses: rBiz, services: rSvc, spareParts: rParts, smartAlerts: rAlerts, total: rAds + rBiz + rSvc + rParts + rAlerts },
        shortages: {
            ads: Math.max(0, 100 - vAds),
            businesses: Math.max(0, 50 - vBiz),
            services: Math.max(0, 50 - vSvc),
            spareParts: Math.max(0, 50 - vParts),
            smartAlerts: Math.max(0, 25 - vAlerts),
            total: Math.max(0, 275 - (vAds + vBiz + vSvc + vParts + vAlerts)),
            reasons
        },
        createdSummary: { ads: 0, businesses: 0, services: 0, spareParts: 0, smartAlerts: 0, total: 0 },
        results
    };
}
