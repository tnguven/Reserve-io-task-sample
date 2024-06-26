import { rateLimit, Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { client } from "../database/redis";
import { rateLimitConfig } from "../configs";

// For protecting the insert endpoints. very basic implementation
// would use third party like Cloudflare or web server like nginx or Traefik
export const withRateLimit = (options?: Partial<Options>) => {
  return rateLimit({
    standardHeaders: "draft-7", // draft-7: combined `RateLimit` header
    ...rateLimitConfig,
    ...(options && options),
    store: new RedisStore({
      sendCommand: async (...args: string[]) => {
        // throws error if the server is not lazy loaded!
        return client.sendCommand(args);
      },
    }),
  });
};
