"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = exports.verifyAdminToken = exports.verifyToken = exports.generateAdminToken = exports.generateToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const env_1 = require("@core/config/env");
const JWT_SECRET = env_1.env.JWT_SECRET;
const ADMIN_JWT_SECRET = env_1.env.ADMIN_JWT_SECRET || env_1.env.JWT_SECRET;
const signToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
        issuer: 'esparex-api',
        audience: 'esparex-client',
        jwtid: (0, crypto_1.randomBytes)(16).toString('hex')
    });
};
exports.signToken = signToken;
/**
 * Generate JWT token with standardized payload
 * @param payload - User/Admin ID and role
 * @returns JWT token string
 */
const generateToken = (payload) => {
    // Convert ObjectId to string for JWT payload
    const tokenPayload = {
        id: payload.id.toString(),
        role: payload.role,
        ...(payload.tokenVersion !== undefined && { tokenVersion: payload.tokenVersion })
    };
    const userTokenTtl = env_1.env.JWT_EXPIRES_IN;
    return jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, {
        expiresIn: userTokenTtl,
        issuer: 'esparex-api',
        audience: 'esparex-client',
        subject: payload.id.toString(),
        jwtid: (0, crypto_1.randomBytes)(16).toString('hex')
    });
};
exports.generateToken = generateToken;
const generateAdminToken = (payload) => {
    const tokenPayload = {
        id: payload.id.toString(),
        role: payload.role
    };
    return jsonwebtoken_1.default.sign(tokenPayload, ADMIN_JWT_SECRET, {
        expiresIn: '8h',
        issuer: 'esparex-api',
        audience: 'esparex-client',
        subject: payload.id.toString(),
        jwtid: (0, crypto_1.randomBytes)(16).toString('hex')
    });
};
exports.generateAdminToken = generateAdminToken;
const verifyToken = (token) => {
    if (token && token.startsWith('mock_token_') && env_1.env.NODE_ENV === 'test') {
        return { id: 'admin_001', role: 'admin', jti: 'mock_jti' };
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "esparex-api",
            audience: "esparex-client",
            clockTolerance: 5
        });
        if (!decoded.exp || !decoded.iat || !decoded.sub)
            return null;
        return decoded;
    }
    catch {
        return null;
    }
};
exports.verifyToken = verifyToken;
const verifyAdminToken = (token) => {
    if (token && token.startsWith('mock_token_') && env_1.env.NODE_ENV === 'test') {
        return { id: 'admin_001', role: 'admin', jti: 'mock_jti' };
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, ADMIN_JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "esparex-api",
            audience: "esparex-client",
            clockTolerance: 5
        });
        if (!decoded.exp || !decoded.iat || !decoded.sub)
            return null;
        return decoded;
    }
    catch {
        return null;
    }
};
exports.verifyAdminToken = verifyAdminToken;
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hash) => {
    return bcryptjs_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
//# sourceMappingURL=auth.js.map