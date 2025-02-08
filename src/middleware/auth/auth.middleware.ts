import {NextFunction, Response} from "express";
import asyncHandler from 'express-async-handler';
import {authConfigJwt} from "../../config/auth.config";
import {ExtendedRequest} from "../../@types/express";
import {validateToken} from "../../utils/token.util";

export const authenticate = asyncHandler(async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) => {
    const tokenConfig = authConfigJwt["access"];
    if (!tokenConfig.secret) {
        throw new Error(`JWT secret for access token is not provided`);
    }

    const authHeader = req.header('Authorization') || req.headers['authorization']
    const token = req.cookies[tokenConfig.tokenName] || (authHeader && authHeader.split(' ')[1]);

    if (!token) {
        res.status(401).json({
            success: false,
            message: `Missing access Token`,
        });
        return;
    }

    const decoded = validateToken(token, 'ACCESS') as { userID: string, role: string };
    if (!decoded) {
        res.status(401).json({
            success: false,
            message: `Invalid access Token`,
        });
        return;
    }

    req.user = decoded;
    next();
})



