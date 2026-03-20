jest.mock("../../models/SystemConfig", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("../../utils/systemConfigHelper", () => ({
    __esModule: true,
    SYSTEM_CONFIG_KEY: "global",
    ensureSystemConfig: jest.fn(),
    invalidateSystemConfigCache: jest.fn(),
}));

import SystemConfig from "../../models/SystemConfig";
import {
    ensureSystemConfig,
    invalidateSystemConfigCache,
} from "../../utils/systemConfigHelper";
import {
    SystemConfigValidationError,
    getSystemConfigForRead,
    updateSystemConfigSections,
} from "../../services/SystemConfigService";

type MutableRecord = Record<string, unknown>;

const createMockConfigDoc = (initial: MutableRecord = {}) => {
    const state: MutableRecord = { ...initial };
    return {
        state,
        updatedBy: undefined as string | undefined,
        updatedAt: undefined as Date | undefined,
        save: jest.fn().mockResolvedValue(undefined),
        get: jest.fn((key: string) => state[key]),
        set: jest.fn((key: string, value: unknown) => {
            state[key] = value;
        }),
    };
};

describe("systemConfigService.updateSystemConfigSections", () => {
    const mockModel = SystemConfig as unknown as { findOne: jest.Mock };
    const mockEnsureSystemConfig = ensureSystemConfig as jest.Mock;
    const mockInvalidateCache = invalidateSystemConfigCache as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("rejects non-object payloads", async () => {
        await expect(updateSystemConfigSections(null, "admin-1")).rejects.toMatchObject({
            name: "SystemConfigValidationError",
            code: "SYSTEM_CONFIG_BODY_INVALID",
            statusCode: 400,
        } satisfies Partial<SystemConfigValidationError>);
    });

    it("rejects unsupported sections", async () => {
        mockModel.findOne.mockResolvedValue(createMockConfigDoc({ ai: { moderation: { enabled: true } } }));

        await expect(
            updateSystemConfigSections({ unknownSection: { foo: "bar" } }, "admin-1")
        ).rejects.toMatchObject({
            code: "SYSTEM_CONFIG_SECTION_UNSUPPORTED",
            statusCode: 400,
        } satisfies Partial<SystemConfigValidationError>);
    });

    it("rejects featureFlags containing non-boolean values", async () => {
        mockModel.findOne.mockResolvedValue(createMockConfigDoc({ featureFlags: { a: true } }));

        await expect(
            updateSystemConfigSections({ featureFlags: { a: true, b: "yes" } }, "admin-1")
        ).rejects.toMatchObject({
            code: "SYSTEM_CONFIG_FEATURE_FLAGS_INVALID",
            statusCode: 400,
        } satisfies Partial<SystemConfigValidationError>);
    });

    it("deep-merges object sections and invalidates cache", async () => {
        const mockDoc = createMockConfigDoc({
            ai: {
                moderation: {
                    enabled: true,
                    autoFlag: true,
                    confidenceThreshold: 85,
                },
            },
        });
        mockModel.findOne.mockResolvedValue(mockDoc);

        const result = await updateSystemConfigSections(
            {
                ai: {
                    moderation: {
                        enabled: false,
                    },
                },
            },
            "admin-42"
        );

        expect(result.updatedSections).toEqual(["ai"]);
        expect(mockDoc.set).toHaveBeenCalledWith(
            "ai",
            expect.objectContaining({
                moderation: expect.objectContaining({
                    enabled: false,
                    autoFlag: true,
                    confidenceThreshold: 85,
                }),
            })
        );
        expect(mockDoc.updatedBy).toBe("admin-42");
        expect(mockDoc.updatedAt).toBeInstanceOf(Date);
        expect(mockDoc.save).toHaveBeenCalledTimes(1);
        expect(mockInvalidateCache).toHaveBeenCalledTimes(1);
    });

    it("uses ensureSystemConfig fallback when singleton does not exist", async () => {
        const fallbackDoc = createMockConfigDoc({
            notifications: {
                email: { enabled: true, senderEmail: "noreply@esparex.com" },
            },
        });
        mockModel.findOne.mockResolvedValue(null);
        mockEnsureSystemConfig.mockResolvedValue(fallbackDoc);

        const result = await updateSystemConfigSections({
            notifications: {
                email: { enabled: false },
            },
        });

        expect(mockEnsureSystemConfig).toHaveBeenCalledTimes(1);
        expect(result.updatedSections).toEqual(["notifications"]);
        expect(fallbackDoc.save).toHaveBeenCalledTimes(1);
        expect(mockInvalidateCache).toHaveBeenCalledTimes(1);
    });

    it("rejects non-array payload for array sections", async () => {
        mockModel.findOne.mockResolvedValue(createMockConfigDoc({ emailTemplates: [] }));

        await expect(
            updateSystemConfigSections({ emailTemplates: { invalid: true } }, "admin-1")
        ).rejects.toMatchObject({
            code: "SYSTEM_CONFIG_SECTION_TYPE_INVALID",
            statusCode: 400,
        } satisfies Partial<SystemConfigValidationError>);
    });

    it("persists section updates and serves updated values on read (PATCH -> GET roundtrip)", async () => {
        const mockDoc = createMockConfigDoc({
            security: {
                twoFactor: { enabled: false },
                sessionTimeoutMinutes: 60,
                ipWhitelist: [],
            },
            platform: {
                maintenance: { enabled: false, message: "Off" },
            },
        });

        mockModel.findOne.mockResolvedValue(mockDoc);

        await updateSystemConfigSections(
            {
                security: {
                    twoFactor: { enabled: true },
                    sessionTimeoutMinutes: 45,
                },
            },
            "admin-99"
        );

        expect(mockDoc.state.security).toEqual(
            expect.objectContaining({
                twoFactor: { enabled: true },
                sessionTimeoutMinutes: 45,
                ipWhitelist: [],
            })
        );

        mockEnsureSystemConfig.mockResolvedValue({
            toJSON: () => mockDoc.state,
        });

        const readConfig = await getSystemConfigForRead();
        const serialized =
            readConfig && typeof (readConfig as { toJSON?: () => Record<string, unknown> }).toJSON === "function"
                ? (readConfig as { toJSON: () => Record<string, unknown> }).toJSON()
                : (readConfig as Record<string, unknown>);

        expect(serialized.security).toEqual(
            expect.objectContaining({
                twoFactor: { enabled: true },
                sessionTimeoutMinutes: 45,
            })
        );
    });
});
