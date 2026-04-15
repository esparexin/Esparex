describe("firebaseAdmin", () => {
    const loadFirebaseAdmin = (envOverrides: {
        NODE_ENV?: "development" | "production" | "test";
        FIREBASE_SERVICE_ACCOUNT_JSON?: string;
        ALLOW_FIREBASE_ADMIN?: boolean;
    } = {}) => {
        const mockInitializeApp = jest.fn();
        const mockCert = jest.fn(() => ({ kind: "credential" }));
        const mockAdmin = {
            apps: [] as unknown[],
            initializeApp: mockInitializeApp,
            credential: {
                cert: mockCert,
            },
            messaging: jest.fn(() => ({})),
        };
        const mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        jest.doMock("firebase-admin", () => ({
            __esModule: true,
            default: mockAdmin,
        }));
        jest.doMock("../../utils/logger", () => ({
            __esModule: true,
            default: mockLogger,
        }));
        jest.doMock("../../config/env", () => ({
            __esModule: true,
            env: {
                NODE_ENV: envOverrides.NODE_ENV ?? "development",
                FIREBASE_SERVICE_ACCOUNT_JSON: envOverrides.FIREBASE_SERVICE_ACCOUNT_JSON,
                ALLOW_FIREBASE_ADMIN: envOverrides.ALLOW_FIREBASE_ADMIN ?? false,
            },
        }));

        // eslint-disable-next-line @typescript-eslint/no-require-imports -- resetModules requires a fresh module load.
        const firebaseAdmin = require("../../config/firebaseAdmin").default;

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
