import pino from "pino";

const config = {
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "SYS:dd-mm-yy HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
  enabled: process.env.NODE_ENV !== "test",
};

export const logger = pino(config);
