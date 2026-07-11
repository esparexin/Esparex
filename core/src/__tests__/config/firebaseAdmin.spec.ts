// Defer mock setup to global variables to completely prevent hoisting ReferenceErrors in SWC
(global as any)._mockInitializeApp = jest.fn();
(global as any)._mockCert = jest.fn(() => ({ kind: "credential" }));
(global as any)._mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
(global as any)._mockEnv = {
    NODE_ENV: "development",
    FIREBASE_SERVICE_ACCOUNT_JSON: undefined,
    ALLOW_FIREBASE_ADMIN: false,
};

jest.mock("firebase-admin", () => ({
    __esModule: true,
    default: {
        apps: [],
        initializeApp: (...args: any[]) => (global as any)._mockInitializeApp(...args),
        credential: {
            cert: (...args: any[]) => (global as any)._mockCert(...args),
        },
        messaging: jest.fn(() => ({
            send: () => "mock_message_id",
            sendEachForMulticast: () => ({ successCount: 0, failureCount: 0, responses: [] }),
        })),
    },
}));

jest.mock("@esparex/core/utils/logger", () => ({
    __esModule: true,
    default: (global as any)._mockLogger,
}));

jest.mock("@esparex/core/config/env", () => ({
    __esModule: true,
    env: (global as any)._mockEnv,
}));

const mockInitializeApp = (global as any)._mockInitializeApp;
const mockCert = (global as any)._mockCert;
const mockLogger = (global as any)._mockLogger;

describe("firebaseAdmin", () => {
    const originalEnv = { ...process.env };

    const loadFirebaseAdmin = (envOverrides: {
        NODE_ENV?: "development" | "production" | "test";
        FIREBASE_SERVICE_ACCOUNT_JSON?: string;
        ALLOW_FIREBASE_ADMIN?: boolean;
    } = {}) => {
        // Sync process.env for Zod/validation logic
        if (envOverrides.NODE_ENV) {
            process.env.NODE_ENV = envOverrides.NODE_ENV;
        }
        if (envOverrides.FIREBASE_SERVICE_ACCOUNT_JSON !== undefined) {
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON = envOverrides.FIREBASE_SERVICE_ACCOUNT_JSON;
        } else {
            delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        }
        if (envOverrides.ALLOW_FIREBASE_ADMIN !== undefined) {
            process.env.ALLOW_FIREBASE_ADMIN = envOverrides.ALLOW_FIREBASE_ADMIN ? "true" : "false";
        } else {
            delete process.env.ALLOW_FIREBASE_ADMIN;
        }

        // Sync global mocked env config
        (global as any)._mockEnv.NODE_ENV = envOverrides.NODE_ENV ?? "development";
        (global as any)._mockEnv.FIREBASE_SERVICE_ACCOUNT_JSON = envOverrides.FIREBASE_SERVICE_ACCOUNT_JSON;
        (global as any)._mockEnv.ALLOW_FIREBASE_ADMIN = envOverrides.ALLOW_FIREBASE_ADMIN ?? false;

        // Reset the mock functions so they have fresh history
        (global as any)._mockInitializeApp.mockReset();
        (global as any)._mockCert.mockReset();
        (global as any)._mockCert.mockReturnValue({ kind: "credential" });
        (global as any)._mockLogger.info.mockReset();
        (global as any)._mockLogger.warn.mockReset();
        (global as any)._mockLogger.error.mockReset();

        // Require the module cleanly
        const firebaseAdmin = require("@esparex/core/config/firebaseAdmin").default;

        // Resolve mockAdmin to the structure we mock above
        const mockAdmin = require("firebase-admin").default;

        return {
            firebaseAdmin,
            mockAdmin,
            mockCert,
            mockInitializeApp,
            mockLogger,
        };
    };

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = { ...originalEnv };
    });

    it("uses the fallback mock when service-account credentials are absent", async () => {
        const { firebaseAdmin, mockCert, mockInitializeApp, mockLogger } = loadFirebaseAdmin({
            NODE_ENV: "development",
        });

        expect(mockCert).not.toHaveBeenCalled();
        expect(mockInitializeApp).not.toHaveBeenCalled();
        expect(mockLogger.warn).toHaveBeenCalledWith(
            "Firebase Admin disabled: FIREBASE_SERVICE_ACCOUNT_JSON is not set."
        );

        const response = await (firebaseAdmin.messaging() as {
            sendEachForMulticast: (message: unknown) => Promise<unknown>;
        }).sendEachForMulticast({});

        expect(response).toEqual({
            successCount: 0,
            failureCount: 0,
            responses: [],
        });
    });

    it("initializes firebase-admin with a cleaned private key when credentials are configured", () => {
        const serviceAccountJson = JSON.stringify({
            project_id: "esparex-test",
            client_email: "firebase-adminsdk@test.example.com",
            private_key: "-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n",
        });

        const { firebaseAdmin, mockAdmin, mockCert, mockInitializeApp } = loadFirebaseAdmin({
            NODE_ENV: "production",
            FIREBASE_SERVICE_ACCOUNT_JSON: serviceAccountJson,
        });

        expect(mockCert).toHaveBeenCalledWith(
            expect.objectContaining({
                project_id: "esparex-test",
                client_email: "firebase-adminsdk@test.example.com",
                private_key: "-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----",
            })
        );
        expect(mockInitializeApp).toHaveBeenCalledWith({
            credential: { kind: "credential" },
        });
        expect(firebaseAdmin).toBe(mockAdmin);
    });

    it("skips initialization in test by default even when credentials are present", async () => {
        const serviceAccountJson = JSON.stringify({
            project_id: "esparex-test",
            client_email: "firebase-adminsdk@test.example.com",
            private_key: "-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n",
        });

        const { firebaseAdmin, mockCert, mockInitializeApp } = loadFirebaseAdmin({
            NODE_ENV: "test",
            FIREBASE_SERVICE_ACCOUNT_JSON: serviceAccountJson,
        });

        expect(mockCert).not.toHaveBeenCalled();
        expect(mockInitializeApp).not.toHaveBeenCalled();
        expect(firebaseAdmin).not.toBeUndefined();

        const messageId = await (firebaseAdmin.messaging() as {
            send: (message: unknown) => Promise<string>;
        }).send({});

        expect(messageId).toBe("mock_message_id");
    });

    it("allows initialization in test when explicitly enabled", () => {
        const serviceAccountJson = JSON.stringify({
            project_id: "esparex-test",
            client_email: "firebase-adminsdk@test.example.com",
            private_key: "-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n",
        });

        const { mockCert, mockInitializeApp } = loadFirebaseAdmin({
            NODE_ENV: "test",
            ALLOW_FIREBASE_ADMIN: true,
            FIREBASE_SERVICE_ACCOUNT_JSON: serviceAccountJson,
        });

        expect(mockCert).toHaveBeenCalledTimes(1);
        expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });

    it("falls back to the mock admin when credential parsing fails", async () => {
        const { firebaseAdmin, mockInitializeApp, mockLogger } = loadFirebaseAdmin({
            NODE_ENV: "production",
            FIREBASE_SERVICE_ACCOUNT_JSON: "{bad-json",
        });

        expect(mockInitializeApp).not.toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith(
            "❌ Firebase Admin Init Failed:",
            expect.any(String)
        );

        const messageId = await (firebaseAdmin.messaging() as {
            send: (message: unknown) => Promise<string>;
        }).send({});

        expect(messageId).toBe("mock_message_id");
    });
});
