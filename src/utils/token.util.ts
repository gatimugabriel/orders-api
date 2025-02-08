import jwt from "jsonwebtoken";
import { authConfigJwt } from '../config/auth.config';
import dotenv from 'dotenv';
import {decryptPayload, encryptPayload} from "./encryption.util";
import {UserAuthPayload} from "../@types/types";
dotenv.config();

const accessTokenSecret = authConfigJwt.access.secret as string
const refreshTokenSecret = authConfigJwt.refresh.secret as string
const passwordResetTokenSecret = authConfigJwt.passwordReset.secret as string

// Generates a JWT token
export  function generateToken(payload: any, expiresIn: string, secretKey: string): string {
    const encryptedPayload = encryptPayload(payload)
    // @ts-ignore
    return jwt.sign({ data: encryptedPayload }, secretKey, { expiresIn });
}

export function validateToken(tokenString: string, tokenType: string): any {
    let secret: string;

    switch (tokenType) {
        case 'REFRESH':
            secret = refreshTokenSecret;
            break;
        case 'ACCESS':
            secret = accessTokenSecret;
            break;
        case 'PASSWORD_RESET':
            secret = passwordResetTokenSecret;
            break;
        default:
            throw new Error('Invalid token type');
    }

    try {
        const token = jwt.verify(tokenString, secret) as jwt.JwtPayload;
        const encryptedPayload = token.data as string;
        return  decryptPayload(encryptedPayload);
    } catch (err) {
        throw new Error('Invalid token');
    }
}

// Generates auth tokens
export function generateAuthTokens(userID: any, role: any): { accessToken: string; refreshToken: string } {
    const userPayload: UserAuthPayload = { userID, role };
    if (!authConfigJwt.access.secret || !authConfigJwt.refresh.secret) {
        throw new Error('JWT secrets are not provided');
    }

    // Generate access token
    const accessToken = generateToken(userPayload, '15m', accessTokenSecret);

    // Generate refresh token
    const refreshToken = generateToken(userPayload, '30d', refreshTokenSecret);

    return { accessToken, refreshToken };
}


