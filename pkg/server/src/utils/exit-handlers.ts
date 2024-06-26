import { logger } from "../logger";

export function exitHandler(cb: () => void) {
  const handler = (signal: string) => {
    logger.info({ signal },"Server shutting down");
    cb();
  };

  ["SIGTERM", "SIGINT", "SIGUSR1", "SIGUSR2", "SIGHUP", "exit"].forEach((event) => {
    process.on(event, handler);
  });
}
