import { serverConfig } from "./configs";
import { exitHandler } from "./utils/exit-handlers";
import { connect } from "./database/redis";
import { logger } from "./logger";

const bootstrap = async () => {
  try {
    const { redisClient, subscribeClient } = await connect();
    const { server } = await import("./server");

    if (serverConfig.enableSwagger) {
      const [swaggerUi, { swaggerDocs }] = await Promise.all([
        import("swagger-ui-express"),
        import("./swagger"),
      ]);
      server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
      server.get("/docs-json", (_, res) => res.json(swaggerDocs));
    }

    const app = server.listen(serverConfig.port, () => {
      logger.info(`Start listening: ${serverConfig.port}`);
    });

    exitHandler(async () => {
      if (app) {
        await Promise.all([
          redisClient.disconnect().catch(logger.error),
          subscribeClient.disconnect().catch(logger.error),
        ]);
        app.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });
  } catch (err) {
    logger.fatal({ err }, "Something went wrong on bootstrap");
    process.kill(process.pid, "exit");
  }
};

void bootstrap();
