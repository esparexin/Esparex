
import CryptoJS from 'crypto-js';
import logger from "@/lib/logger";

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY?.trim() || process.env.ENCRYPTION_KEY?.trim();
if (!SECRET_KEY) {
    throw new Error('[encryption] NEXT_PUBLIC_ENCRYPTION_KEY is not set. Add it to your .env.local file.');
}

/**
 * Encrypts data using AES-256
 * @param data - The data to encrypt (object, string, number, etc.)
 * @returns Encrypted string
 */
/**
 * Encrypts data using AES-256
 * @param data - The data to encrypt (object, string, number, etc.)
 * @returns Encrypted string
 */
export const encryptData = (data: unknown): string => {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
        return encrypted;
    } catch (error) {
        logger.error("Encryption failed:", error);
        return "";
    }
};

/**
 * Decrypts data using AES-256
 * @param ciphertext - The encrypted string
 * @returns Decrypted data (original type)
 */
export const decryptData = <T = unknown>(ciphertext: string): T | null => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) return null;
        return JSON.parse(decryptedString) as T;
    } catch (error) {
        logger.error("Decryption failed:", error);
        return null;
    }
};
