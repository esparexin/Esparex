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
    getStateLocations
} from "../../services/location/LocationHierarchyService";
import { lookupLocationByPincode } from "../../services/location/LocationSearchService";
import { normalizeLocation } from "../../services/location/LocationNormalizer";
import { reverseGeocode } from "../../services/location/ReverseGeocodeService";

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
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(value),
    }),
});

describe("locationService regression", () => {
    const publicCanonicalFilter = {
        isActive: true,
        verificationStatus: { $in: ["verified", null] },
    };

    beforeEach(() => {
        mockLocationModel.findOne.mockReset();
        mockLocationModel.find.mockReset();
        mockLocationModel.findById.mockReset();
        mockLocationModel.aggregate.mockReset();
        mockAdminBoundary.find.mockReset();
        mockLocationModel.find.mockReturnValue(mockFindChain([]));
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

    it("reverseGeocode uses the nearest settlement-level canonical match without tiered area gating", async () => {
        mockAdminBoundary.find.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });
        mockLocationModel.findOne.mockReturnValueOnce(
            mockFindOneResult({
                _id: "65f0a1b2c3d4e5f607182930",
                name: "Macherla",
                state: "Andhra Pradesh",
                country: "India",
                level: "city",
                coordinates: { type: "Point", coordinates: [79.44, 16.48] },
                isActive: true,
                verificationStatus: "verified",
            })
        );

        const result = await reverseGeocode(16.48, 79.44);

        expect(result?.name).toBe("Macherla");
        expect(mockLocationModel.findOne).toHaveBeenCalledTimes(1);
        expect(mockLocationModel.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                isActive: true,
                verificationStatus: { $in: ["verified", null] },
                level: { $in: ["area", "village", "city", "district"] },
                coordinates: expect.objectContaining({
                    $near: expect.objectContaining({
                        $maxDistance: 50000,
                    }),
                }),
            })
        );
    });

    it("reverseGeocode falls back to regional canonical matches only when no nearby settlement exists", async () => {
        mockAdminBoundary.find.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });
        mockLocationModel.findOne
            .mockReturnValueOnce(mockFindOneResult(null))
            .mockReturnValueOnce(
                mockFindOneResult({
                    _id: "65f0a1b2c3d4e5f607182931",
                    name: "Andhra Pradesh",
                    country: "India",
                    level: "state",
                    coordinates: { type: "Point", coordinates: [79.44, 16.48] },
                    isActive: true,
                    verificationStatus: "verified",
                })
            );

        const result = await reverseGeocode(16.48, 79.44);

        expect(result?.name).toBe("Andhra Pradesh");
        expect(mockLocationModel.findOne).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                isActive: true,
                verificationStatus: { $in: ["verified", null] },
                level: { $in: ["area", "village", "city", "district"] },
                coordinates: expect.objectContaining({
                    $near: expect.objectContaining({
                        $maxDistance: 50000,
                    }),
                }),
            })
        );
        expect(mockLocationModel.findOne).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                isActive: true,
                verificationStatus: { $in: ["verified", null] },
                level: { $in: ["state", "country"] },
                coordinates: expect.objectContaining({
                    $near: expect.objectContaining({
                        $maxDistance: 250000,
                    }),
                }),
            })
        );
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
        // Sprint 3: queries for level:'state' anchors directly
        mockLocationModel.find.mockReturnValueOnce(
            mockFindChain([
                {
                    _id: "65f0a1b2c3d4e5f607182930",
                    name: "Andhra Pradesh",
                    country: "India",
                    level: "state",
                    coordinates: { type: "Point", coordinates: [79.44, 16.48] },
                    isPopular: true,
                    isActive: true,
                },
            ])
        );

        const states = await getStateLocations();
        expect(states).toHaveLength(1);
        expect(states[0]?.name).toBe("Andhra Pradesh");
        expect(states[0]?.level).toBe("state");
        expect(mockLocationModel.find).toHaveBeenCalledWith(expect.objectContaining({
            ...publicCanonicalFilter,
            level: "state",
        }));
    });

    it("getCitiesByStateId resolves cities for a state anchor", async () => {
        // First call: findOne for state anchor resolution
        mockLocationModel.findOne.mockReturnValueOnce(
            mockFindOneResult({
                _id: new mongoose.Types.ObjectId("65f0a1b2c3d4e5f607182930"),
                name: "Andhra Pradesh",
                level: "state",
                country: "India"
            })
        );

        // Second call: find for cities under that state anchor
        mockLocationModel.find.mockReturnValueOnce(
            mockFindChain([
                {
                    _id: "65f0a1b2c3d4e5f607182931",
                    name: "Macherla",
                    city: "Macherla",
                    state: "Andhra Pradesh",
                    country: "India",
                    level: "city",
                    coordinates: { type: "Point", coordinates: [79.44, 16.48] },
                },
            ])
        );

        const cities = await getCitiesByStateId("65f0a1b2c3d4e5f607182930");
        expect(cities).toHaveLength(1);
        expect(cities[0]?.city).toBe("Macherla");
        expect(cities[0]?.level).toBe("city");
        expect(mockLocationModel.findOne).toHaveBeenCalledWith(expect.objectContaining({
            _id: expect.any(mongoose.Types.ObjectId),
            ...publicCanonicalFilter,
        }));
        expect(mockLocationModel.find).toHaveBeenCalledWith(expect.objectContaining({
            ...publicCanonicalFilter,
            level: "city",
        }));
    });

    it("getAreasByCityId returns area-level rows for a city anchor", async () => {
        // First call: findOne for city anchor resolution
        mockLocationModel.findOne.mockReturnValueOnce(
            mockFindOneResult({
                _id: new mongoose.Types.ObjectId("65f0a1b2c3d4e5f607182931"),
                name: "Macherla",
                level: "city",
                country: "India"
            })
        );

        // Second call: find for areas under that city anchor
        mockLocationModel.find.mockReturnValueOnce(
            mockFindChain([
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
            ])
        );

        const areas = await getAreasByCityId("65f0a1b2c3d4e5f607182931");
        expect(areas).toHaveLength(1);
        expect(areas[0]?.name).toBe("Old Town");
        expect(areas[0]?.level).toBe("area");
        expect(mockLocationModel.findOne).toHaveBeenCalledWith(expect.objectContaining({
            _id: expect.any(mongoose.Types.ObjectId),
            ...publicCanonicalFilter,
        }));
        expect(mockLocationModel.find).toHaveBeenCalledWith(expect.objectContaining({
            ...publicCanonicalFilter,
            level: "area",
        }));
    });

    it("lookupLocationByPincode only searches verified canonical locations before fallback", async () => {
        mockLocationModel.find.mockReturnValueOnce(
            mockFindChain([
                {
                    _id: "65f0a1b2c3d4e5f607182930",
                    name: "Abids",
                    city: "Hyderabad",
                    state: "Telangana",
                    country: "India",
                    level: "area",
                    coordinates: { type: "Point", coordinates: [78.4767, 17.3913] },
                    isActive: true,
                    verificationStatus: "verified",
                },
            ])
        );

        await lookupLocationByPincode("500001");

        expect(mockLocationModel.find).toHaveBeenCalledWith(expect.objectContaining(publicCanonicalFilter));
    });

    it("normalizeLocation rejects non-verified canonical locationIds when verification is required", async () => {
        mockLocationModel.findOne.mockReturnValueOnce(
            {
                lean: jest.fn().mockResolvedValue({
                    _id: "65f0a1b2c3d4e5f607182930",
                    name: "Abids",
                    state: "Telangana",
                    country: "India",
                    level: "area",
                    coordinates: { type: "Point", coordinates: [78.4767, 17.3913] },
                    isActive: true,
                    verificationStatus: "pending",
                }),
            } as any
        );

        await expect(
            normalizeLocation(
                { locationId: "65f0a1b2c3d4e5f607182930" },
                { requireLocationId: true }
            )
        ).rejects.toMatchObject({
            message: "Valid verified location selection is required",
        });
    });

    it("reverseGeocode accepts legacy canonical rows without verificationStatus", async () => {
        mockAdminBoundary.find.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });
        mockLocationModel.findOne.mockReturnValueOnce(
            mockFindOneResult({
                _id: "69464c1214759c4fa9b94596",
                name: "Surajpur",
                country: "India",
                level: "area",
                coordinates: { type: "Point", coordinates: [77.52078, 28.54011] },
                isActive: true,
            })
        );

        const result = await reverseGeocode(28.54011, 77.52078);

        expect(result?.name).toBe("Surajpur");
        expect(mockLocationModel.findOne).toHaveBeenCalledWith(expect.objectContaining({
            ...publicCanonicalFilter,
            level: { $in: ["area", "village", "city", "district"] },
            coordinates: expect.any(Object),
        }));
    });

    it("reverseGeocode prefers verified canonical locations for detected matches", async () => {
        mockAdminBoundary.find.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });
        mockLocationModel.findOne.mockReturnValueOnce(
            mockFindOneResult({
                _id: "65f0a1b2c3d4e5f607182930",
                name: "Macherla",
                state: "Andhra Pradesh",
                country: "India",
                level: "city",
                coordinates: { type: "Point", coordinates: [79.44, 16.48] },
                isActive: true,
                verificationStatus: "verified",
            })
        );

        await reverseGeocode(16.48, 79.44);

        expect(mockLocationModel.findOne).toHaveBeenCalledWith(expect.objectContaining({
            ...publicCanonicalFilter,
            level: { $in: ["area", "village", "city", "district"] },
            coordinates: expect.any(Object),
        }));
    });
});
