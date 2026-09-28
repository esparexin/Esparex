jest.mock('@esparex/core/models/Report', () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
    },
}));

import type { PipelineStage } from 'mongoose';
import Report from '../../models/Report';
import { getReportedAdsAggregation } from '../../domains/listings/application/ad/ad/AdDetailService';

const mockedAggregate = jest.mocked(Report.aggregate);

describe('getReportedAdsAggregation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('preserves orphaned reports when ad is deleted and falls back to report adTitle', async () => {
        const fakeGroup = {
            _id: '69a707cdb4d8ade2c54dc40b',
            reportCount: 2,
            reports: [
                {
                    _id: 'r1',
                    adTitle: 'Archived Listing Title',
                    reason: 'Spam',
                    status: 'open',
                    createdAt: new Date('2026-03-01'),
                    reportedBy: 'u1',
                },
                {
                    _id: 'r2',
                    adTitle: 'Archived Listing Title',
                    reason: 'Fraud',
                    status: 'open',
                    createdAt: new Date('2026-03-02'),
                    reportedBy: 'u2',
                },
            ],
            adDetails: null,
            isAutoHidden: false,
        };

        mockedAggregate
            .mockResolvedValueOnce([fakeGroup])
            .mockResolvedValueOnce([{ count: 1 }]);

        const result = await getReportedAdsAggregation({ status: 'open' }, { skip: 0, limit: 10 });

        expect(result.total).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
            id: '69a707cdb4d8ade2c54dc40b',
            reportId: 'r2',
            reason: 'Fraud',
            status: 'open',
            reportCount: 2,
            ad: { title: 'Archived Listing Title' },
        });

        // Verify aggregation pipeline includes preserveNullAndEmptyArrays
        const pipelineArg = mockedAggregate.mock.calls[0][0];
        const unwindAdStage = pipelineArg.find((stage): stage is PipelineStage.Unwind => '$unwind' in stage);
        expect(unwindAdStage).toBeDefined();
        expect(unwindAdStage?.$unwind).toEqual({ path: '$adDetails', preserveNullAndEmptyArrays: true });
    });
});
