import { reverseGeocode } from '../../services/location/ReverseGeocodeService';
import Location from '../../models/Location';
import AdminBoundary from '../../models/AdminBoundary';
import { getCache, setCache } from '../../utils/redisCache';
import { haversineDistance } from '../../utils/mongoGeoUtils';

jest.mock('@esparex/core/models/Location', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        find: jest.fn()
    }
}));
jest.mock('@esparex/core/models/AdminBoundary', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        find: jest.fn()
    }
}));
jest.mock('@esparex/core/utils/redisCache');

describe('ReverseGeocodeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCache as jest.Mock).mockResolvedValue(null);
        (setCache as jest.Mock).mockResolvedValue(undefined);
    });

    describe('haversineDistance logic and exact GPS coordinate preservation', () => {
        it('should correctly calculate haversine distance between coords', async () => {
            const lat1 = 19.0760;
            const lon1 = 72.8777;
            const lat2 = 19.0800;
            const lon2 = 72.8800;

            const distance = haversineDistance(lat1, lon1, lat2, lon2);
            expect(distance).toBeLessThan(7.5);
        });

        it('should preserve exact input GPS coordinates when a settlement is matched (even 6-7 km away)', async () => {
            const inputLat = 19.0760;
            const inputLng = 72.8777;
            // Settlement located ~6.8km away
            const cityCenterLat = 19.0200;
            const cityCenterLng = 72.8500;

            const distance = haversineDistance(inputLat, inputLng, cityCenterLat, cityCenterLng);
            expect(distance).toBeGreaterThan(6.0);
            expect(distance).toBeLessThan(7.5);

            (AdminBoundary.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            });

            // Mock nearest settlement hit
            (Location.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        _id: 'mock_city_id',
                        name: 'Mumbai',
                        country: 'India',
                        level: 'city',
                        coordinates: { type: 'Point', coordinates: [cityCenterLng, cityCenterLat] },
                        isActive: true
                    })
                })
            });

            (Location.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            });

            const result = await reverseGeocode(inputLat, inputLng);

            expect(result).toBeDefined();
            expect(result?.city).toBe('Mumbai');
            
            // The coordinates MUST PRESERVE the input GPS coordinates, NOT city center
            expect(result?.coordinates?.coordinates[0]).toBe(inputLng);
            expect(result?.coordinates?.coordinates[1]).toBe(inputLat);
            expect(result?.isSnapped).toBe(false);
        });

        it('should accurately preserve reproduced coordinates (lat = 16.4812, lng = 79.4412)', async () => {
            const inputLat = 16.4812;
            const inputLng = 79.4412;
            const settlementLat = 16.5300;
            const settlementLng = 79.4000;

            (AdminBoundary.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            });

            (Location.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        _id: 'mock_macherla_id',
                        name: 'Macherla',
                        city: 'Macherla',
                        state: 'Andhra Pradesh',
                        country: 'India',
                        level: 'city',
                        coordinates: { type: 'Point', coordinates: [settlementLng, settlementLat] },
                        isActive: true
                    })
                })
            });

            (Location.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            });

            const result = await reverseGeocode(inputLat, inputLng);

            expect(result).toBeDefined();
            expect(result?.name).toBe('Macherla');
            expect(result?.coordinates?.coordinates).toEqual([79.4412, 16.4812]);
            expect(result?.isSnapped).toBe(false);
        });
    });
});
