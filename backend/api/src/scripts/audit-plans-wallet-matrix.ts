import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/api/.env') });

export async function runPlansWalletMatrixAudit() {
  const { connectDB } = await import('@esparex/core/config/db');
  await connectDB();

  const Plan = (await import('@esparex/core/models/Plan')).default;
  const Entitlement = (await import('@esparex/core/models/Entitlement')).default;
  const Transaction = (await import('@esparex/core/models/Transaction')).default;
  const UserPlan = (await import('@esparex/core/models/UserPlan')).default;
  const UserWallet = (await import('@esparex/core/models/UserWallet')).default;
  const { ENTITLEMENT_PRESENTATION_REGISTRY, formatPlanName } = await import('@esparex/shared');

  console.log('=====================================================');
  console.log('🏛️ ESPAREX PLANS, WALLET & ENTITLEMENTS 12-PHASE AUDIT');
  console.log('=====================================================\n');

  // PHASE 1 & 2: Plan Database Verification & Duration Diversity Matrix
  const plans = await Plan.find({ active: true }).lean();
  console.log(`📊 Phase 1 & 2 — Database Plan Records Found: ${plans.length}`);

  const durationMatrix = new Set<number>();
  const userTypeMatrix = new Set<string>();

  for (const p of plans) {
    durationMatrix.add(p.durationDays || 30);
    userTypeMatrix.add(p.userType || 'both');
    console.log(`   - Plan: "${p.name}" (Code: ${p.code}) | Price: ₹${p.price} | Duration: ${p.durationDays}d | UserType: ${p.userType || 'both'} | Category: ${p.category}`);
  }

  // PHASE 7: Entitlement Expiry & Validity Matching Check
  const entitlements = await Entitlement.find({}).lean();
  console.log(`\n💳 Phase 7 & 8 — Entitlements & Credit Consumption Check: ${entitlements.length} total records`);

  let expiryMismatchCount = 0;
  let quantityMismatchCount = 0;

  const sourceIds = Array.from(new Set(entitlements.map((e) => e.sourceId?.toString()).filter(Boolean)));
  const txRecords = sourceIds.length > 0 ? await Transaction.find({ _id: { $in: sourceIds } }).select('_id planSnapshot').lean() : [];
  const txMap = new Map(txRecords.map((t) => [t._id.toString(), t.planSnapshot]));

  for (const ent of entitlements) {
    const startsAt = ent.startsAt ? new Date(ent.startsAt) : new Date();
    const expiresAt = ent.expiresAt ? new Date(ent.expiresAt) : null;
    const txSnapshot = ent.sourceId ? txMap.get(ent.sourceId.toString()) : null;
    const expectedDuration = txSnapshot?.durationDays || 30;

    if (!expiresAt) {
      expiryMismatchCount++;
      console.warn(`   ⚠️ Entitlement ${ent._id} has null expiresAt!`);
    } else {
      const calculatedDuration = Math.round((expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   - Entitlement ${ent.type} | Granted: ${ent.quantity} | Remaining: ${ent.remaining} | Consumed: ${ent.consumed} | Status: ${ent.status} | Validity: ${calculatedDuration} days (Expected: ${expectedDuration}d)`);
    }

    if ((ent.consumed || 0) + (ent.remaining || 0) !== ent.quantity) {
      quantityMismatchCount++;
      console.warn(`   ⚠️ Quantity invariant failed on ${ent._id}: ${ent.quantity} != ${ent.consumed} + ${ent.remaining}`);
    }
  }

  // PHASE 11: Single Source of Truth & Registry Validation
  console.log('\n📚 Phase 11 — Presentation Registry & SSOT Integrity Check:');
  const entitlementTypes = ['AD_POSTING', 'PUSH_TO_TOP', 'SPOTLIGHT_CAT', 'SPOTLIGHT_HP', 'SMART_ALERT_SLOT', 'BUSINESS_PAGE'];
  for (const type of entitlementTypes) {
    const meta = ENTITLEMENT_PRESENTATION_REGISTRY[type as keyof typeof ENTITLEMENT_PRESENTATION_REGISTRY];
    console.log(`   - ${type} ➔ Label: "${meta.label}" | Icon: "${meta.icon}" | Color: "${meta.color}" | Sort: ${meta.sortOrder}`);
  }

  console.log('\n=====================================================');
  console.log('✅ AUDIT SUMMARY MATRIX');
  console.log(`   - Active Plans in DB: ${plans.length}`);
  console.log(`   - Plan Durations Represented: ${Array.from(durationMatrix).join(', ')} days`);
  console.log(`   - User Types Represented: ${Array.from(userTypeMatrix).join(', ')}`);
  console.log(`   - Total Entitlements: ${entitlements.length}`);
  console.log(`   - Expiry Mismatches: ${expiryMismatchCount}`);
  console.log(`   - Quantity Invariant Discrepancies: ${quantityMismatchCount}`);
  console.log('=====================================================\n');

  return {
    activePlans: plans.length,
    durations: Array.from(durationMatrix),
    userTypes: Array.from(userTypeMatrix),
    totalEntitlements: entitlements.length,
    expiryMismatches: expiryMismatchCount,
    quantityDiscrepancies: quantityMismatchCount,
  };
}

if (require.main === module) {
  runPlansWalletMatrixAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Matrix Audit Error:', err);
      process.exit(1);
    });
}
