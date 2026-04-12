import { connectOpsDb } from './commandUtils';
import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../types';

/**
 * 🗺️ Add Missing Indian States/UTs
 */
export const addMissingStatesCommand: OpsCommand = {
    name: 'add-missing-states',
    description: 'Inserts missing Indian states and union territories into the locations collection',
    blastRadius: 'low',
    run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
        const isApply = context.flags.apply;
        const db = await connectOpsDb();
        const locations = db.collection('locations');

        const india = await locations.findOne({ name: 'India', level: 'country' });
        if (!india) {
            throw new Error('Canonical India location document not found.');
        }

        const missingStates = [
            { name: 'Assam', level: 'state' },
            { name: 'Chandigarh', level: 'state' },
            { name: 'Puducherry', level: 'state' }
        ];

        const results = { inserted: 0, alreadyExisting: 0, errors: 0 };

        for (const stateData of missingStates) {
            const existing = await locations.findOne({ 
                name: stateData.name, 
                level: stateData.level,
                parentId: india._id
            });

            if (existing) {
                results.alreadyExisting++;
                continue;
            }

            if (isApply) {
                let lat = 0, lng = 0;
                if (stateData.name === 'Assam') { lat = 26.2006; lng = 92.9376; }
                if (stateData.name === 'Chandigarh') { lat = 30.7333; lng = 76.7794; }
                if (stateData.name === 'Puducherry') { lat = 11.9416; lng = 79.8083; }

                await locations.insertOne({
                    name: stateData.name,
                    slug: `${stateData.name.toLowerCase()}-india`,
                    normalizedName: stateData.name.toLowerCase(),
                    country: 'India',
                    level: 'state',
                    parentId: india._id,
                    path: [india._id],
                    isActive: true,
                    isPopular: false,
                    verificationStatus: 'verified',
                    priority: 0,
                    tier: 3,
                    aliases: [],
                    coordinates: { type: 'Point', coordinates: [lng, lat] },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false
                });
                results.inserted++;
            } else {
                results.inserted++;
            }
        }

        return {
            summary: {
                ...results,
                mode: isApply ? 'APPLY' : 'DRY_RUN'
            }
        };
    }
};
