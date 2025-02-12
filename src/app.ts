import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import { PrismaClient } from "@prisma/client";

import routes from "./routes";
import { notFound, errorHandler } from "./middleware/errors/global.middleware";
import { setupSwagger } from "./config/swagger";

dotenv.config()
export const app: Express = express();

export const prisma = new PrismaClient()

const PORT = process.env["PORT"] || 8080;
const NODE_ENV = process.env["NODE_ENV"] || 'development';
const DB_NAME = process.env["DB_NAME"];

async function main() {
    // --- CORS ---//
    const allowedOrigins = [
        process.env["CLIENT_ORIGIN"],
        process.env["ADMIN_ORIGIN"],
        process.env["SERVER_URL"],
    ].filter(Boolean) as string[];

    const corsOptions = {
        origin: allowedOrigins,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE',
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Length', 'X-JSON']
    };

    app.options('*', cors(corsOptions));
    app.use(cors(corsOptions));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(fileUpload({ useTempFiles: true }))
    app.use(cookieParser());
    app.use(morgan('dev'));

    // --- Routes ---//
    app.get("/", (_req: Request, res: Response) => {
        res.send(`Welcome to Orders API. Visit ${process.env["SERVER_URL"]}/api-docs for more info`);
    });
    // Setup Swagger documentation
    setupSwagger(app);

    const base_api = "/api/v1";
    routes(app, base_api)

    // -- global errors middleware
    app.use(notFound)
    app.use(errorHandler)



    app.listen(PORT, async () => {
        console.log(
            `Server running in "${NODE_ENV}" mode on port: "${PORT}"    `
        );
    });
}

main()
    .then(async () => {
        console.log(`Connecting to database...`);
        console.log(`Connected to ${DB_NAME} DB!`)
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.warn(`failed to connect to database\n`)
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
