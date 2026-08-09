import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/api/.env') });

export async function remediatePlanNames() {
  const { connectDB } = await import('@esparex/core/config/db');
  await connectDB();

  const Plan = (await import('@esparex/core/models/Plan')).default;

  console.log('🏷️ Remediating duplicate Plan display names in MongoDB...');

  const planNameUpdates: Record<string, string> = {
    AD_PACK_5: 'More Ads 5-Pack',
    SPOTLIGHT_1: 'Spotlight Boost 1-Pack',
    ALERTS_10: 'Smart Alerts 10-Pack',
    TEST_PLAN: 'More Ads 20-Pack',
    USER_DEFAULT_PLAN: 'Free Starter Plan',
  };

  let updatedCount = 0;
  for (const [code, distinctName] of Object.entries(planNameUpdates)) {
    const res = await Plan.updateMany({ code }, { $set: { name: distinctName } });
    updatedCount += res.modifiedCount;
  }

  console.log(`✅ Updated ${updatedCount} plan records with distinct, consumer-friendly names.`);

  const plans = await Plan.find({ active: true }).lean();
  console.log('\n📊 Updated Plans Summary:');
  plans.forEach((p) => {
    console.log(`   - Code: ${p.code} ➔ Name: "${p.name}" | Price: ₹${p.price} | Duration: ${p.durationDays}d`);
  });
}

if (require.main === module) {
  remediatePlanNames()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Remediation Error:', err);
      process.exit(1);
    });
}
