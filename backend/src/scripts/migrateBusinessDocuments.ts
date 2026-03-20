import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Business from '../models/Business';

dotenv.config();

const migrate = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const businesses = await mongoose.connection.collection('businesses').find({}).toArray();
        console.log(`Found ${businesses.length} businesses to check`);

        let migratedCount = 0;

        for (const biz of businesses) {
            // Check if documents is in the old object format
            if (biz.documents && !Array.isArray(biz.documents)) {
                const oldDocs = biz.documents;
                const newDocs: any[] = [];

                if (oldDocs.idProof && oldDocs.idProof.length > 0) {
                    newDocs.push({
                        type: 'idProof',
                        files: oldDocs.idProof,
                        status: 'approved', // Assume existing are approved or match biz status
                        meta: oldDocs.idProofType || 'Identity Proof',
                        version: 1,
                        uploadedAt: biz.createdAt || new Date()
                    });
                }

                if (oldDocs.businessProof && oldDocs.businessProof.length > 0) {
                    newDocs.push({
                        type: 'businessProof',
                        files: oldDocs.businessProof,
                        status: 'approved',
                        meta: 'Business Proof',
                        version: 1,
                        uploadedAt: biz.createdAt || new Date()
                    });
                }

                if (oldDocs.certificates && oldDocs.certificates.length > 0) {
                    newDocs.push({
                        type: 'certificate',
                        files: oldDocs.certificates,
                        status: 'approved',
                        meta: 'Registration Certificate',
                        version: 1,
                        uploadedAt: biz.createdAt || new Date()
                    });
                }

                await mongoose.connection.collection('businesses').updateOne(
                    { _id: biz._id },
                    { $set: { documents: newDocs } }
                );

                migratedCount++;
                console.log(`Migrated business: ${biz.name} (${biz._id})`);
            }
        }

        console.log(`Migration complete. Migrated ${migratedCount} businesses.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

void migrate();
