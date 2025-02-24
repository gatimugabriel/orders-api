import {Request, Response, NextFunction} from "express";
import {Prisma} from "@prisma/client";

const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = error.meta?.customMessage || error.meta?.cause || error.message || 'Server Error Occurred. Try again later';

    console.log(`\n\t\t+-+-+-+-+-+++________ ERROR _______+-+-+-+-+-+++\n\n`, error,
        `\n\n\t\t +-+-+-+-+-+++________ END _______+-+-+-+-+-+++\n\n`
    )

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                statusCode = 400;
                message = error.meta?.customMessage || 'Unique constraint failed: A record with this identifier already exists.';
                break;
            case 'P2025':
                statusCode = 404;
                message = error.meta?.customMessage || 'Record not found.';
                break;
            default:
                statusCode = 500;
                message = 'Internal server errors';
        }
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
    });
}

export {notFound, errorHandler};
