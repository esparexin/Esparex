import mongoose from 'mongoose';

jest.mock("../../config/db", () => ({
    getUserConnection: () => ({
        models: {},
        model: () => ({
            find: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            }),
        }),
    }),
}));

jest.mock("../../models/Location", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        aggregate: jest.fn(),
    },
}));

jest.mock("../../models/LocationAnalytics", () => ({
    __esModule: true,
    default: {
        updateOne: jest.fn(),
        find: jest.fn(),
    },
}));

jest.mock("../../models/AdminBoundary", () => ({
    __esModule: true,
    default: { find: jest.fn() },
}));

jest.mock("../../utils/redisCache", () => ({
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn().mockResolvedValue(undefined),
    CACHE_KEYS: {
        reverseGeocode: (lat: number, lng: number) => `reverse:${lat}:${lng}`,
    },
    CACHE_TTLS: { REVERSE_GEOCODE: 300 },
}));

import Location from "../../models/Location";
import AdminBoundary from "../../models/AdminBoundary";
import {
    getAreasByCityId,
    getCitiesByStateId,
    getDefaultCenterLocation,
    getStateLocations,
    reverseGeocode,
} from "../../services/LocationService";

const mockLocationModel = Location as unknown as {
    findOne: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    aggregate: jest.Mock;
};

const mockAdminBoundary = AdminBoundary as unknown as {
    find: jest.Mock;
};

const mockFindOneResult = (value: unknown) => {
    const chain = {
        lean: jest.fn().mockResolvedValue(value),
        sort: jest.fn().mockReturnThis(),
    };
    return {
        select: jest.fn().mockReturnValue(chain),
    };
};

const mockFindByIdResult = (value: unknown) => ({
    select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(value),
    }),
});

const mockFindChain = (value: unknown[] = []) => ({
    select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(value),
    }),
});

describe("locationService regression", () => {
    beforeEach(() => {
        mockLocationModel.findOne.mockReset();
        mockLocationModel.find.mockReset();
        mockLocationModel.findById.mockReset();
        mockLocationModel.aggregate.mockReset();
        mockAdminBoundary.find.mockReset();
    });

    it("reverseGeocode resolves nearest location in normalized format", async () => {
        // AdminBoundary returns no boundary match → falls through to Location.findOne
        mockAdminBoundary.find.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });
        mockLocationModel.findOne.mockReturnValueOnce(
            mockFindOneResult({
                _id: "65f0a1b2c3d4e5f607182930",
                name: "Macherla",
                city: "Macherla",
                district: "Palnadu",
                state: "Andhra Pradesh",
                country: "India",
                level: "city",
                coordinates: { type: "Point", coordinates: [79.44, 16.48] },
                isActive: true,
                verificationStatus: "verified",
            })
        );

        const result = await reverseGeocode(16.48, 79.44);

        expect(result).toBeTruthy();
        expect(result?.city).toBe("Macherla");
        expect(result?.state).toBe("Andhra Pradesh");
        expect(result?.locationId).toBe("65f0a1b2c3d4e5f607182930");
        expect(result?.name).toBe("Macherla");
    });

    it("getDefaultCenterLocation falls back to configured center payload when nearest is unavailable", async () => {
        mockLocationModel.findOne.mockReturnValueOnce(mockFindOneResult(null));

        const result = await getDefaultCenterLocation({
            lat: 16.48,
            lng: 79.44,
        });

        expect(result).toBeTruthy();
        expect(result?.source).toBe("default");
        expect(result?.coordinates).toEqual({ type: "Point", coordinates: [79.44, 16.48] });
        expect(result?.city).toBe("Default Center");
    });

    it("getStateLocations returns grouped state records", async () => {
        // Service first queries for level:'state' anchors — return empty to fall through to aggregate
        mockLocationModel.find.mockReturnValueOnce(mockFindChain([]));
        mockLocationModel.aggregate.mockResolvedValueOnce([
            {
                id: new mongoose.Types.ObjectId("65f0a1b2c3d4e5f607182930"),
                state: "Andhra Pradesh",
                country: "India",
                coordinates: { type: "Point", coordinates: [79.44, 16.48] },
                isPopular: true,
                isActive: true,
            },
        ]);

        const states = await getStateLocations();
        expect(states).toHaveLength(1);
        expect(states[0]?.name).toBe("Andhra Pradesh");
        expect(states[0]?.level).toBe("state");
    });

    it("getCitiesByStateId resolves cities for a state anchor", async () => {
        mockLocationModel.findOne
            .mockReturnValueOnce(
                mockFindOneResult({
                    state: "Andhra Pradesh",
                    country: "India",
                })
            );
        // Second call: findById for hierarchy level check — null skips hierarchy path → falls to aggregate
        mockLocationModel.findById.mockReturnValueOnce(mockFindByIdResult(null));
        mockLocationModel.aggregate.mockResolvedValueOnce([
            {
                id: new mongoose.Types.ObjectId("65f0a1b2c3d4e5f607182931"),
                city: "Macherla",
                state: "Andhra Pradesh",
                country: "India",
                coordinates: { type: "Point", coordinates: [79.44, 16.48] },
            },
        ]);

        const cities = await getCitiesByStateId("65f0a1b2c3d4e5f607182930");
        expect(cities).toHaveLength(1);
        expect(cities[0]?.city).toBe("Macherla");
        expect(cities[0]?.level).toBe("city");
    });

    it("getAreasByCityId returns area-level rows for a city anchor", async () => {
        mockLocationModel.findOne
            .mockReturnValueOnce(
                mockFindOneResult({
                    city: "Macherla",
                    state: "Andhra Pradesh",
                    country: "India",
                })
            );
        // findById for hierarchy level check — null skips hierarchy path → falls to Location.find
        mockLocationModel.findById.mockReturnValueOnce(mockFindByIdResult(null));

        const areaChain = {
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([
                {
                    _id: "65f0a1b2c3d4e5f607182932",
                    name: "Old Town",
                    city: "Macherla",
                    state: "Andhra Pradesh",
                    country: "India",
                    level: "area",
                    coordinates: { type: "Point", coordinates: [79.43, 16.49] },
                    isActive: true,
                    isPopular: false,
                    verificationStatus: "verified",
                },
            ]),
        };
        mockLocationModel.find.mockReturnValueOnce({
            select: jest.fn().mockReturnValue(areaChain),
        });

        const areas = await getAreasByCityId("65f0a1b2c3d4e5f607182931");
        expect(areas).toHaveLength(1);
        expect(areas[0]?.name).toBe("Old Town");
        expect(areas[0]?.level).toBe("area");
    });
});
