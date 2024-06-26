import { createClient } from "redis";
import { logger } from "../logger";
import { redisConfig } from "../configs";

const config = {
  socket: {
    port: redisConfig.port,
    host: redisConfig.host,
  },
};

export const client = createClient(config);
client.on("error", (err) => logger.fatal({ err }, `Redis client error`));
export const subscriber = createClient(config);
subscriber.on("error", (err) => logger.fatal({ err }, "Redis Subscriber Error"));

export const connect = async () => {
  try {
    const redisClient = await client.connect();
    const subscribeClient = await subscriber.connect();
    // Subscriber to handle key expiration events
    // This way when the user hold expire we will remove it from the holds
    // Can be made scalable like adding more but not necessary for the scope of this task
    await subscribeClient.pSubscribe("__keyevent@0__:expired", async (message) => {
      const holdKeyPattern = /^hold:(.*?):(.*?):(.*?)$/;
      const match = holdKeyPattern.exec(message);
      if (match) {
        const [, eventId, userId, seatId] = match;
        // Get the userId from the hold data set before it expires
        try {
          await redisClient.sRem(`user:${userId}:holds:${eventId}`, seatId);
          logger.info({ eventId, seatId }, "pSubscribe: hold removed");
        } catch (err) {
          logger.error({ err }, "pSubscribe: an error occurred", `Redis client error: ${err}`);
        }
      }
    });
    logger.info("Connected to redis ✅");
    return { redisClient, subscribeClient };
  } catch (err) {
    logger.fatal("Connection failed to redis ⛔");
    throw err;
  }
};

export type DbClient = typeof client;
