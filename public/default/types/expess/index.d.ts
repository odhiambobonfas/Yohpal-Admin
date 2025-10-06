import { RedisClientType } from "redis";
import "express-serve-static-core";

declare module "express-serve-static-core" {
    interface Request {
        redis: RedisClientType;
    }
}