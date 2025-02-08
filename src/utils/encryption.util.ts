import crypto from "node:crypto";

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const TAG_LENGTH = 16;

function encryptPayload(payload: any): string {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY as string), iv);

    // Encrypt
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get the auth tag
    const tag = cipher.getAuthTag();

    const result = Buffer.concat([iv, tag, Buffer.from(encrypted, 'base64')]);

    // Return as base64 string
    return result.toString('base64');
}

function decryptPayload(encryptedPayload: string): any {
    try {
        const buffer = Buffer.from(encryptedPayload, 'base64');

        // Extract IV, tag and encrypted data
        const iv = buffer.subarray(0, IV_LENGTH);
        const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
        const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY as string), iv);
        decipher.setAuthTag(tag);

        // Decrypt the data
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
        throw new Error('Decryption failed');
    }
}

export { encryptPayload, decryptPayload }
