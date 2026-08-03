import {
    getModerationDiagnostics,
    overrideModerationDecision,
} from '../../controllers/admin/adminModerationDiagnosticsController';
import { submitListingAppeal } from '../../controllers/user/userListingAppealController';

describe('Admin Workspace & Appeals (PR 6)', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        req = { params: { imageId: 'img-101', listingId: 'ad-202' }, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('returns moderation diagnostics with AI labels and confidence scores', async () => {
        await getModerationDiagnostics(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    imageId: 'img-101',
                    aiLabels: expect.arrayContaining(['Electronics']),
                }),
            })
        );
    });

    it('processes manual override for admin moderators', async () => {
        req.body = { newOutcome: 'approved', overrideReason: 'manual_override' };
        await overrideModerationDecision(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    outcome: 'approved',
                }),
            })
        );
    });

    it('submits user appeal for review', async () => {
        req.body = { appealReason: 'Product is genuine phone accessory' };
        await submitListingAppeal(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    status: 'pending_review',
                }),
            })
        );
    });
});
