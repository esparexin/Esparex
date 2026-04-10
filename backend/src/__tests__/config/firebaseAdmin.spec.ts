describe("firebaseAdmin", () => {
    const originalEnv = process.env;

    const loadFirebaseAdmin = () => {
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
        process.env = { ...originalEnv };
        delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        delete process.env.ALLOW_FIREBASE_ADMIN;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("uses the fallback mock when service-account credentials are absent", async () => {
        process.env.NODE_ENV = "development";

        const { firebaseAdmin, mockCert, mockInitializeApp, mockLogger } = loadFirebaseAdmin();

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
        process.env.NODE_ENV = "production";
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
            project_id: "esparex-test",
            client_email: "firebase-adminsdk@test.example.com",
            private_key: "-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n",
        });

        const { firebaseAdmin, mockAdmin, mockCert, mockInitializeApp } = loadFirebaseAdmin();

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
        process.env.NODE_ENV = "test";
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
            project_id: "esparex-test",
            client_email: "firebase-adminsdk@test.example.com",
            private_key: "-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n",
        });

        const { firebaseAdmin, mockCert, mockInitializeApp } = loadFirebaseAdmin();

        expect(mockCert).not.toHaveBeenCalled();
        expect(mockInitializeApp).not.toHaveBeenCalled();
        expect(firebaseAdmin).not.toBeUndefined();

        const messageId = await (firebaseAdmin.messaging() as {
            send: (message: unknown) => Promise<string>;
        }).send({});

        expect(messageId).toBe("mock_message_id");
    });

    it("allows initialization in test when explicitly enabled", () => {
        process.env.NODE_ENV = "test";
        process.env.ALLOW_FIREBASE_ADMIN = "true";
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
            project_id: "esparex-test",
            client_email: "firebase-adminsdk@test.example.com",
            private_key: "-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n",
        });

        const { mockCert, mockInitializeApp } = loadFirebaseAdmin();

        expect(mockCert).toHaveBeenCalledTimes(1);
        expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });

    it("falls back to the mock admin when credential parsing fails", async () => {
        process.env.NODE_ENV = "production";
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "{bad-json";

        const { firebaseAdmin, mockInitializeApp, mockLogger } = loadFirebaseAdmin();

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
