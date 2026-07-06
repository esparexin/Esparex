import { reverseGeocode } from '../../services/location/ReverseGeocodeService';
import Location from '../../models/Location';
import AdminBoundary from '../../models/AdminBoundary';
import { getCache, setCache } from '../../infrastructure/cache/redisCache';
import { haversineDistance } from '../../infrastructure/db/mongoGeoUtils';

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
jest.mock('@esparex/core/infrastructure/cache/redisCache');

describe('ReverseGeocodeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCache as jest.Mock).mockResolvedValue(null);
        (setCache as jest.Mock).mockResolvedValue(undefined);
    });

    describe('haversineDistance logic and snapping', () => {
        it('should correctly calculate haversine distance between Mumbai coords and snap', async () => {
            // Simulated Mumbai coords: 19.0760, 72.8777
            // Target city coords: 19.0800, 72.8800 (very close)
            const lat1 = 19.0760;
            const lon1 = 72.8777;
            const lat2 = 19.0800;
            const lon2 = 72.8800;

            const distance = haversineDistance(lat1, lon1, lat2, lon2);
            expect(distance).toBeLessThan(7.5); // Should be well within 7.5km
        });

        it('should snap coordinates to the nearest settlement if within 7.5km', async () => {
            const inputLat = 19.0760;
            const inputLng = 72.8777;
            const cityCenterLat = 19.0800;
            const cityCenterLng = 72.8800;

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
            
            // The coordinates should be SNAPPED to the city center, not the input
            expect(result?.coordinates?.coordinates[0]).toBe(cityCenterLng);
            expect(result?.coordinates?.coordinates[1]).toBe(cityCenterLat);
            expect(result?.isSnapped).toBe(true);
        });

        it('should NOT snap coordinates if distance > 7.5km', async () => {
            const inputLat = 19.0760;
            const inputLng = 72.8777;
            // Place city center 20km away
            const cityCenterLat = 19.2000;
            const cityCenterLng = 72.9000;

            const dist = haversineDistance(inputLat, inputLng, cityCenterLat, cityCenterLng);
            expect(dist).toBeGreaterThan(7.5);

            (AdminBoundary.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            });

            (Location.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        _id: 'mock_city_id',
                        name: 'Far City',
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
            expect(result?.city).toBe('Far City');
            
            // The coordinates should REMAIN the input, NOT snapped
            expect(result?.coordinates?.coordinates[0]).toBe(inputLng);
            expect(result?.coordinates?.coordinates[1]).toBe(inputLat);
            expect(result?.isSnapped).toBeUndefined();
        });
    });
});
