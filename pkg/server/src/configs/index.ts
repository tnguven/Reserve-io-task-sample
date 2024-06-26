import type { Options } from "express-rate-limit";
import { resolve } from "path";
import dotEnv from "dotenv";
import * as process from "node:process";

const isDevelopment = process.env.NODE_ENV !== "production";

dotEnv.config({
  ...(isDevelopment && { path: resolve(__dirname, "../../../.env") }),
});

// adding default values for the sake of this task
// in real world there should be a validation for the configs
export const redisConfig = <const>{
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const serverConfig = <const>{
  port: Number(process.env.PORT) || 8080,
  enableSwagger: process.env.ENABLE_SWAGGER || true,
  swaggerTarget: process.env.SWAGGER_TARGET || `http://localhost:${process.env.PORT || 8080}`,
};

export const secrets = <const>{
  token_secret: process.env.TOKEN_SECRET || "ac1fd9fd2bb74e0280bd302",
  tokenMaxAge: Number(process.env.TOKEN_MAX_AGE) || 60 * 10, // 10 min
};

export const rateLimitConfig: Partial<Options> = {
  windowMs: Number(process.env.RATE_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes
  limit: Number(process.env.RATE_LIMIT) || 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  legacyHeaders: Boolean(process.env.RATE_LEGACY_HEADER) || false, // Disable the `X-RateLimit-*` headers.
};

export const limitsConfig = <const>{
  maxHoldsPerUser: Number(process.env.MAX_HOLDS_PER_USER) || 5,
  holdDuration: Number(process.env.HOLD_DURATION) || 60, // seconds
};

export type Secrets = typeof secrets;
export type ServerConfig = typeof serverConfig;
export type RedisConfig = typeof redisConfig;
export type LimitsConfig = typeof limitsConfig;
