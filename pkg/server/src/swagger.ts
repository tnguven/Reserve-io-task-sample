import { serverConfig } from "./configs";

import { userDoc } from "./routes/user.doc";
import { eventDoc } from "./routes/events.doc";

export const swaggerDocs = {
  openapi: "3.0.0",
  info: {
    title: "Reserve-io API",
    description: "Reserve Service API",
    version: "1.0.0",
  },
  servers: [{ url: serverConfig.swaggerTarget, description: "Reserve Service API" }],
  paths: {
    ...userDoc,
    ...eventDoc,
  },
  components: {
    securitySchemes: {
      SessionToken: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
      },
    },
    schemas: {},
  },
  security: [{ Authorization: [] }],
};
