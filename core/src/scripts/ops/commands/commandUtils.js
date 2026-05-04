"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectOpsDb = exports.getMongoUri = void 0;
require("dotenv/config");
const db_1 = require("@core/config/db");
/** Resolve the MongoDB connection URI from environment variables. */
const getMongoUri = () => {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri)
        throw new Error('Missing MONGODB_URI (or MONGO_URI)');
    return uri;
};
exports.getMongoUri = getMongoUri;
/** Connect to MongoDB using the app's connection manager and return the user DB handle. */
const connectOpsDb = async () => {
    await (0, db_1.connectDB)();
    const db = (0, db_1.getUserConnection)().db;
    if (!db)
        throw new Error('User DB connection established without database handle');
    return db;
};
exports.connectOpsDb = connectOpsDb;
//# sourceMappingURL=commandUtils.js.map