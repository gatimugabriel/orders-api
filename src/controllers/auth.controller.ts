import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { ExtendedRequest } from "../@types/express";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { generateAuthTokens } from "../utils/token.util";

const prisma = new PrismaClient().$extends(withAccelerate());
const User = prisma.user
const Token = prisma.token

// @ desc --- Create new user
// @ route  --POST-- [base_api]/auth/signup`
export const signUp = asyncHandler(async (req: Request, res: Response) => {
    const { password, first_name, last_name, email, role } = req.body;

    const emailExists = await User.findUnique({ where: { email } });
    if (emailExists) {
        res.status(409);
        throw new Error("Email is already used in this platform. Try another one");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
        data: {
            first_name,
            last_name,
            password: hashedPassword,
            email,
            role
        }
    });

    if (!newUser) {
        res.status(500);
        throw new Error("Failed to create user. Try again later");
    }

    // generate auth tokens
    const { accessToken, refreshToken } = generateAuthTokens(newUser.id, newUser.role)

    // save REFRESH  token
    await Token.create({
        data: {
            userID: newUser.id,
            token: refreshToken,
            action: "AUTH",
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });

    res.status(201).json({
        message: "User created successfully",
        user: newUser,
        accessToken,
        refreshToken
    });
});

// @ desc ---- User Login -> set tokens
// @ route  --POST-- [base_api]/auth/signIn
export const signIn = asyncHandler(async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findUnique({ where: { email } });
    if (!user) {
        res.status(404);
        throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, (user.password as string))
    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const { accessToken, refreshToken } = generateAuthTokens(user.id, user.role)

    // save REFRESH  token
    await Token.create({
        data: {
            userID: user.id,
            token: refreshToken,
            action: "AUTH",
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });

    res.status(200).json({ accessToken })
});

// @ desc ---- Logout user -> destroy refresh token
// @ route--GET-- [base_api] / auth / sign - out
export const signOut = asyncHandler(async (req: ExtendedRequest, res: Response) => {
    const { user } = req

    const destroyToken = await Token.deleteMany({
        where: { userID: user?.userId as number, action: "AUTH" },
    });

    if (!destroyToken) {
        res.status(500);
        throw new Error("Failed to logout");
    }

    // clear tokens in http-only cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ success: true, message: "Logged Out" });
});

// @ desc ---- Refresh Access Token
// @ route  --POST-- [base_api]/auth/refresh
export const refresh = asyncHandler(async (req: ExtendedRequest, res: Response) => {
    const { user } = req;
    const currentUser = await User.findUnique({
        where: { id: user?.userId as number }
    });

    if (!currentUser) {
        res.status(404);
        throw new Error("Unknown User");
    }

    // generate new access token
    const { accessToken, refreshToken } = generateAuthTokens(currentUser.id, currentUser.role)

    res.status(200).json({ accessToken: accessToken });
});
