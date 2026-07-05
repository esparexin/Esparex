import { CatalogOrchestrator } from '@esparex/core/services';

import mongoose from "mongoose";
import { connectDB } from "@esparex/core/config/db";
import Brand from "@esparex/core/models/Brand";
import Model from "@esparex/core/models/Model";
import SparePart from "@esparex/core/models/SparePart";

async function run(): Promise<void> {
    console.info("[brand-verify] Connecting to MongoDB...");
    await connectDB();
    console.info("[brand-verify] Connected.");

    // Clean up any existing verification fixtures
    await Brand.deleteMany({ name: "Verify Dummy Brand" });
    await Model.deleteMany({ name: { $in: ["Verify Dummy Model A", "Verify Dummy Model B"] } });
    await SparePart.deleteMany({ name: { $in: ["Verify Dummy Part A", "Verify Dummy Part B"] } });

    // 1. Create a dummy Brand
    const brand = new Brand({
        name: "Verify Dummy Brand",
        slug: "verify-dummy-brand",
        isActive: true,
        isDeleted: false,
        categoryIds: [new mongoose.Types.ObjectId()]
    });
    await brand.save();
    const brandId = String(brand._id);
    console.info(`[brand-verify] Created brand: ${brandId}`);

    // 2. Create Model A linked to Brand
    const modelA = new Model({
        name: "Verify Dummy Model A",
        slug: "verify-dummy-model-a",
        brandId: brand._id,
        isActive: true,
        isDeleted: false,
        categoryIds: brand.categoryIds
    });
    await modelA.save();
    console.info(`[brand-verify] Created Model A: ${modelA._id}`);

    // 3. Create SparePart A linked to Model A
    const partA = new SparePart({
        name: "Verify Dummy Part A",
        displayName: "Verify Dummy Part A",
        canonicalName: "verify dummy part a",
        title: "Verify Dummy Part A",
        slug: "verify-dummy-part-a",
        brandId: brand._id,
        modelId: modelA._id,
        isActive: true,
        isDeleted: false,
        categoryIds: brand.categoryIds,
        condition: "new"
    });
    await partA.save();
    console.info(`[brand-verify] Created SparePart A (linked to model): ${partA._id}`);

    // 4. Create SparePart B linked directly to Brand (no model)
    const partB = new SparePart({
        name: "Verify Dummy Part B",
        displayName: "Verify Dummy Part B",
        canonicalName: "verify dummy part b",
        title: "Verify Dummy Part B",
        slug: "verify-dummy-part-b",
        brandId: brand._id,
        isActive: true,
        isDeleted: false,
        categoryIds: brand.categoryIds,
        condition: "used"
    });
    await partB.save();
    console.info(`[brand-verify] Created SparePart B (linked directly to brand): ${partB._id}`);

    // 5. Test Cascade Soft-Delete via CatalogOrchestrator
    console.info("\n--- Running brand soft-delete and cascade... ---");
    // Soft-delete the brand itself
    await Brand.findByIdAndUpdate(brandId, { isDeleted: true, isActive: false, deletedAt: new Date() });
    const result = await CatalogOrchestrator.cascadeBrandDelete(brandId);
    console.info(`[brand-verify] Cascade results:`, result);

    if (result.deletedModels === 1 && result.deletedSpareParts === 2) {
        console.info("[brand-verify] SUCCESS: Returned counts match expectations (1 model, 2 spare parts).");
    } else {
        console.error(`[brand-verify] FAILURE: Count mismatch. Expected { deletedModels: 1, deletedSpareParts: 2 }, got:`, result);
    }

    // 6. Verify soft-delete status in DB (using setOptions withDeleted: true or searching isDeleted: true)
    const brandCheck = await Brand.findById(brandId);
    console.info(`[brand-verify] Brand active query check:`, brandCheck ? "Found (failed)" : "Not found (correctly filtered out/soft-deleted)");

    const softDeletedBrand = await Brand.findOne({ _id: brandId }).setOptions({ withDeleted: true });
    console.info(`[brand-verify] Brand soft-deleted properties: isDeleted=${softDeletedBrand?.isDeleted}, isActive=${softDeletedBrand?.isActive}`);

    const softDeletedModel = await Model.findOne({ _id: modelA._id }).setOptions({ withDeleted: true });
    console.info(`[brand-verify] Model soft-deleted properties: isDeleted=${softDeletedModel?.isDeleted}, isActive=${softDeletedModel?.isActive}`);

    const softDeletedPartA = await SparePart.findOne({ _id: partA._id }).setOptions({ withDeleted: true });
    console.info(`[brand-verify] SparePart A soft-deleted properties: isDeleted=${softDeletedPartA?.isDeleted}, isActive=${softDeletedPartA?.isActive}`);

    const softDeletedPartB = await SparePart.findOne({ _id: partB._id }).setOptions({ withDeleted: true });
    console.info(`[brand-verify] SparePart B soft-deleted properties: isDeleted=${softDeletedPartB?.isDeleted}, isActive=${softDeletedPartB?.isActive}`);

    if (softDeletedBrand?.isDeleted && !softDeletedBrand.isActive && softDeletedModel?.isDeleted && !softDeletedModel.isActive && softDeletedPartA?.isDeleted && !softDeletedPartA.isActive && softDeletedPartB?.isDeleted && !softDeletedPartB.isActive) {
        console.info("[brand-verify] SUCCESS: Brand and all dependent Models and Spare Parts were soft-deleted correctly in the database.");
    } else {
        console.error("[brand-verify] FAILURE: Some records were not correctly soft-deleted in the database.");
    }

    // 7. Clean up
    await Brand.deleteMany({ name: "Verify Dummy Brand" });
    await Model.deleteMany({ name: { $in: ["Verify Dummy Model A", "Verify Dummy Model B"] } });
    await SparePart.deleteMany({ name: { $in: ["Verify Dummy Part A", "Verify Dummy Part B"] } });

    await mongoose.disconnect();
    console.info("\n[brand-verify] Done.");
    process.exit(0);
}

run().catch(err => {
    console.error("[brand-verify] FATAL:", err);
    process.exit(1);
});
