import express, { Express, Request, Response } from "express";
import fileUpload from "express-fileupload";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import { setupSwagger } from "./config/swagger";
import { errorHandler, notFound } from "./middleware/errors/global.middleware";
import routes from "./routes";

dotenv.config()
export const app: Express = express();

export const prisma = new PrismaClient()

const PORT = process.env["PORT"] || 8080;
const ENVIRONMENT = process.env["ENVIRONMENT"] || 'development';
const DB_NAME = process.env["DB_NAME"];

async function main() {
    // --- CORS ---//
    const allowedOrigins = [
        process.env["CLIENT_ORIGIN"],
        process.env["ADMIN_ORIGIN"],
        process.env["SERVER_URL"],
    ].filter((origin) => origin) as string[];

    const corsOptions = {
        origin: allowedOrigins,
        credentials: true,
    };
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
            `Server running in "${ENVIRONMENT}" mode on port: "${PORT}"    `
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
