import {Redis} from "ioredis"

//  creates a new redis instance with given configurations from .env
const redisInstance = (): Redis => {
    const host = process.env["REDIS_HOST"] as string
    const port = Number(process.env["REDIS_PORT"])

    return host === "localhost" ?
        new Redis({host, port})
        :
        new Redis(process.env["REDIS_URL"] as string);
}

export const redis = redisInstance();