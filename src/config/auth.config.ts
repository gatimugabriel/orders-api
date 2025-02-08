import dotenv from 'dotenv';
dotenv.config()
const jwt_access_token_secret: string | undefined = process.env.ACCESS_TOKEN_SECRET
const  jwt_refresh_token_secret: string | undefined = process.env.REFRESH_TOKEN_SECRET

export const authConfigJwt = {
    access: {
        secret: jwt_access_token_secret,
        tokenName: 'accessToken',
        errorType: 'INVALID_ACCESS_TOKEN',
    },
    refresh: {
        secret: jwt_refresh_token_secret,
        tokenName: 'refreshToken',
        errorType: 'INVALID',
    },
    passwordReset: {
        secret: process.env.PASSWORD_RESET_TOKEN_SECRET,
        tokenName: 'passwordResetToken',
        errorType: 'INVALID_PASSWORD_RESET_TOKEN',
    }
};


