import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/api/.env') });

export async function remediateLegacyEntitlements() {
  const { connectDB, getUserConnection } = await import('@esparex/core/config/db');
  await connectDB();

  const Entitlement = (await import('@esparex/core/models/Entitlement')).default;
  const Transaction = (await import('@esparex/core/models/Transaction')).default;

  console.log('🔄 Starting Phase 6 Legacy Entitlement Remediation & Validation...');

  const db = getUserConnection();
  const legacyEntitlements = await Entitlement.find({ expiresAt: null }).lean();
  console.log(`🔍 Found ${legacyEntitlements.length} legacy entitlements with null expiresAt.`);

  let remediatedCount = 0;
  let validationErrors = 0;

  for (const ent of legacyEntitlements) {
    const startsAt = ent.startsAt ? new Date(ent.startsAt) : new Date();
    let durationDays = 30;

    if (ent.sourceId) {
      const tx = await Transaction.findById(ent.sourceId).select('planSnapshot').lean();
      if (tx?.planSnapshot?.durationDays) {
        durationDays = tx.planSnapshot.durationDays;
      }
    }

    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await Entitlement.updateOne(
      { _id: ent._id },
      { $set: { expiresAt } }
    );
    remediatedCount++;
  }

  // Verification Audit: Validate remaining + consumed === quantity
  const allEntitlements = await Entitlement.find({}).lean();
  for (const ent of allEntitlements) {
    const sum = (ent.consumed || 0) + (ent.remaining || 0);
    if (sum !== ent.quantity) {
      console.warn(`⚠️ Quantity mismatch on Entitlement ${ent._id}: quantity=${ent.quantity}, consumed=${ent.consumed}, remaining=${ent.remaining}`);
      validationErrors++;
    }
  }

  console.log(`✅ Phase 6 Remediation Complete! Remediated: ${remediatedCount}, Total Checked: ${allEntitlements.length}, Validation Discrepancies: ${validationErrors}`);
  return { remediatedCount, totalChecked: allEntitlements.length, validationErrors };
}

if (require.main === module) {
  remediateLegacyEntitlements()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Remediation Error:', err);
      process.exit(1);
    });
}
