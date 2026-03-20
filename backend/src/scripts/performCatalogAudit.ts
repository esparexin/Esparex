import mongoose from 'mongoose';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Model from '../models/Model';
import ScreenSize from '../models/ScreenSize';
import SparePart from '../models/SparePart';
import ServiceType from '../models/ServiceType';
import { connectDB, getAdminConnection } from '../config/db';
import logger from '../utils/logger';

async function performAudit() {
    console.log('--- ESPAREX CATALOG DATA AUDIT ---');
    
    try {
        await connectDB();
        
        // 1. Categories Audit
        console.log('\n[1. CATEGORIES]');
        const categories = await Category.find({}).lean();
        console.log(`Total Categories: ${categories.length}`);
        const activeCats = categories.filter(c => c.isActive && !c.isDeleted);
        console.log(`Active Categories: ${activeCats.length}`);
        
        const adCats = categories.filter(c => (c.listingType || []).includes('postad'));
        const serviceCats = categories.filter(c => (c.listingType || []).includes('postservice'));
        const sparePartCats = categories.filter(c => (c.listingType || []).includes('postsparepart'));
        
        console.log(`- Post Ad Capabilities: ${adCats.length}`);
        console.log(`- Post Service Capabilities: ${serviceCats.length}`);
        console.log(`- Post Spare Part Capabilities: ${sparePartCats.length}`);
        
        // 2. Brands Audit
        console.log('\n[2. BRANDS]');
        const brands = await Brand.find({}).lean();
        console.log(`Total Brands: ${brands.length}`);
        const orphanBrands = brands.filter(b => !b.categoryIds || b.categoryIds.length === 0);
        console.log(`Orphan Brands (No Category): ${orphanBrands.length}`);
        
        // 3. Models Audit
        console.log('\n[3. MODELS]');
        const models = await Model.find({}).lean();
        console.log(`Total Models: ${models.length}`);
        const orphanModels = models.filter(m => !m.brandId);
        console.log(`Orphan Models (No Brand): ${orphanModels.length}`);
        
        // 4. Screen Sizes Audit
        console.log('\n[4. SCREEN SIZES]');
        const screenSizes = await ScreenSize.find({}).lean();
        console.log(`Total Screen Sizes: ${screenSizes.length}`);
        
        // 5. Spare Parts Audit
        console.log('\n[5. SPARE PARTS]');
        const spareParts = await SparePart.find({}).lean();
        console.log(`Total Spare Part Masters: ${spareParts.length}`);
        
        // 6. Service Types Audit
        console.log('\n[6. SERVICE TYPES]');
        const serviceTypes = await ServiceType.find({}).lean();
        console.log(`Total Service Type Masters: ${serviceTypes.length}`);

        // --- Flow Readiness ---
        console.log('\n[FLOW READINESS]');
        
        const catIdStr = (cat: any) => cat._id.toString();
        const normalizeIds = (doc: any) => {
            const ids: string[] = [];
            if (doc.categoryIds && Array.isArray(doc.categoryIds)) {
                doc.categoryIds.forEach((id: any) => ids.push(id.toString()));
            } else if (doc.categoryId) {
                ids.push(doc.categoryId.toString());
            }
            return ids;
        };

        // Post Ad readiness
        console.log('\n--- Post Ad Category Readiness (Category -> Brand -> Model) ---');
        for (const cat of adCats) {
            const id = catIdStr(cat);
            const linkedBrands = brands.filter(b => normalizeIds(b).includes(id));
            
            let modelsCount = 0;
            if (linkedBrands.length > 0) {
                const brandIds = linkedBrands.map(b => b._id.toString());
                modelsCount = models.filter(m => {
                    const mBrandId = m.brandId?.toString();
                    const mCatIds = normalizeIds(m);
                    return brandIds.includes(mBrandId) && mCatIds.includes(id);
                }).length;
            }

            const isReady = linkedBrands.length > 0 && modelsCount > 0;
            const status = isReady ? 'READY' : 'NOT READY';
            console.log(`- ${cat.name} (${id}): ${status} [Brands: ${linkedBrands.length}, Models: ${modelsCount}]`);
        }
        
        // Post Service readiness
        console.log('\n--- Post Service Category Readiness (Category -> Service Types) ---');
        for (const cat of serviceCats) {
            const id = catIdStr(cat);
            const linkedServices = serviceTypes.filter(s => normalizeIds(s).includes(id));
            const status = linkedServices.length > 0 ? 'READY' : 'SERVICE FLOW BLOCKED (No Service Types)';
            console.log(`- ${cat.name} (${id}): ${status} [Services: ${linkedServices.length}]`);
        }
        
        // Post Spare Part readiness
        console.log('\n--- Post Spare Parts Category Readiness (Category -> Spare Parts) ---');
        for (const cat of sparePartCats) {
            const id = catIdStr(cat);
            const linkedParts = spareParts.filter(p => normalizeIds(p).includes(id));
            const status = linkedParts.length > 0 ? 'READY' : 'SPARE PART FLOW BLOCKED (No Parts)';
            console.log(`- ${cat.name} (${id}): ${status} [Parts: ${linkedParts.length}]`);
        }

        // --- Integrity Checks ---
        console.log('\n[INTEGRITY CHECKS]');
        const slugs = categories.map(c => c.slug);
        const duplicateSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
        console.log(`Duplicate Category Slugs: ${duplicateSlugs.length > 0 ? duplicateSlugs.join(', ') : 'None'}`);

        process.exit(0);
    } catch (error) {
        console.error('Audit failed:', error);
        process.exit(1);
    }
}

performAudit();
