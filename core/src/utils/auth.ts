import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { env } from '../config/env';
import { Types } from 'mongoose';

const JWT_SECRET = env.JWT_SECRET;
const ADMIN_JWT_SECRET = env.ADMIN_JWT_SECRET || env.JWT_SECRET;


/* -------------------------------------------------------------------------- */
/* JWT Payload Type                                                           */
/* -------------------------------------------------------------------------- */

export interface JwtPayload {
    id: string;
    role: string;
    tokenVersion?: number;
    iat: number;
    exp: number;
    sub: string;
    jti?: string;
    iss?: string;
    aud?: string | string[];
}

export const signToken = (payload: Record<string, unknown>) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
        issuer: 'esparex-api',
        audience: 'esparex-client',
        jwtid: randomBytes(16).toString('hex')
    });
};

/**
 * Generate JWT token with standardized payload
 * @param payload - User/Admin ID and role
 * @returns JWT token string
 */
export const generateToken = (payload: { id: Types.ObjectId | string; role: string; tokenVersion?: number }) => {
    // Convert ObjectId to string for JWT payload
    const tokenPayload: Record<string, unknown> = {
        id: payload.id.toString(),
        role: payload.role,
        ...(payload.tokenVersion !== undefined && { tokenVersion: payload.tokenVersion })
    };
    const userTokenTtl = env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'];
    return jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: userTokenTtl,
        issuer: 'esparex-api',
        audience: 'esparex-client',
        subject: payload.id.toString(),
        jwtid: randomBytes(16).toString('hex')
    });
};

export const generateAdminToken = (payload: { id: Types.ObjectId | string; role: string }) => {
    const tokenPayload = {
        id: payload.id.toString(),
        role: payload.role
    };
    return jwt.sign(tokenPayload, ADMIN_JWT_SECRET, {
        expiresIn: '8h' as jwt.SignOptions['expiresIn'],
        issuer: 'esparex-api',
        audience: 'esparex-client',
        subject: payload.id.toString(),
        jwtid: randomBytes(16).toString('hex')
    });
};

export const verifyToken = (token: string) => {
    if (token && token.startsWith('mock_token_') && env.NODE_ENV === 'test') {
        return { id: 'admin_001', role: 'admin', jti: 'mock_jti' };
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "esparex-api",
            audience: "esparex-client",
            clockTolerance: 5
        }) as JwtPayload;

        if (!decoded.exp || !decoded.iat || !decoded.sub) return null;

        return decoded;
    } catch {
        return null;
    }
};

export const verifyAdminToken = (token: string) => {
    if (token && token.startsWith('mock_token_') && env.NODE_ENV === 'test') {
        return { id: 'admin_001', role: 'admin', jti: 'mock_jti' };
    }
    try {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "esparex-api",
            audience: "esparex-client",
            clockTolerance: 5
        }) as JwtPayload;

        if (!decoded.exp || !decoded.iat || !decoded.sub) return null;

        return decoded;
    } catch {
        return null;
    }
};

export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
};
