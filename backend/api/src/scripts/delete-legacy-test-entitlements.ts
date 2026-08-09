import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/api/.env') });

export async function deleteLegacyTestEntitlements() {
  const { connectDB } = await import('@esparex/core/config/db');
  await connectDB();

  const Entitlement = (await import('@esparex/core/models/Entitlement')).default;

  console.log('🗑️ Deleting all legacy test entitlement records...');

  const result = await Entitlement.deleteMany({});
  console.log(`✅ Successfully deleted ${result.deletedCount} legacy test entitlement records.`);

  const remaining = await Entitlement.countDocuments();
  console.log(`📊 Remaining active DB entitlements: ${remaining}`);
}

if (require.main === module) {
  deleteLegacyTestEntitlements()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Deletion Error:', err);
      process.exit(1);
    });
}
