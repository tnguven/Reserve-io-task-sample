import { describe, test, expect, afterAll, beforeEach, beforeAll } from "vitest";
import httpStatus from "http-status";

import { requestWithHeaders, request, requestWithCookie } from "./tool";
import { connect, type DbClient } from "../src/database/redis";
import type { Express } from "express";

const email = "test@test.com";
const password = "secret1";

describe("USER router", () => {
  const rootPath = "/v1/user";
  let client: DbClient;
  let subClient: DbClient;
  let server: Express;

  beforeAll(async () => {
    const { redisClient, subscribeClient } = await connect();
    client = redisClient;
    subClient = subscribeClient;
    await client.flushAll();
    const { server: app } = await import("../src/server"); // lazy
    server = app;
  });

  afterAll(async () => {
    await client.flushAll();
    await Promise.all([client.quit(), subClient.quit()]);
  });

  describe.sequential("POST: /v1/user/signin", () => {
    test.sequential("must return invalid email", async () => {
      await request(server, `${rootPath}/signin`, "post")
        .send({ email: "invalid@email", password })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toEqual(["Invalid email"]);
        });
    });

    test.sequential("must return invalid minimum password char", async () => {
      await request(server, `${rootPath}/signin`, "post")
        .send({ email, password: "12345" })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toEqual(["String must contain at least 6 character(s)"]);
        });
    });

    test.sequential("must return invalid maximum password char", async () => {
      await request(server, `${rootPath}/signin`, "post")
        .send({ email, password: "a".repeat(129) })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toEqual(["String must contain at most 128 character(s)"]);
        });
    });

    test.sequential(`must return created user`, async () => {
      await request(server, `${rootPath}/signin`, "post")
        .send({ email, password })
        .expect(httpStatus.CREATED)
        .expect((response) => {
          expect(response.body.id).toBeDefined();
          expect(response.body.email).toBeDefined();
          expect(response.body.created_at).toBeDefined();
        });
    });

    test.sequential("must reject duplicate email", async () => {
      await request(server, `${rootPath}/signin`, "post")
        .send({ email, password })
        .expect(httpStatus.CONFLICT);
    });

    test.sequential("must limit the request after 10 attempt", async () => {
      await Promise.all(
        // previous 5 test update the rate limit so 5 attempt left
        // last request has to fail
        Array.from({ length: 5 }).map((_, i) =>
          request(server, `${rootPath}/signin`, "post")
            .send({ email: `test${i}@test.com`, password })
            .expect(i > 4 ? httpStatus.TOO_MANY_REQUESTS : httpStatus.CREATED),
        ),
      );
    });
  });

  describe.sequential("POST: /v1/user/login", () => {
    test.sequential("must return invalid email", async () => {
      await request(server, `${rootPath}/login`, "post")
        .send({ email: "invalid@email", password })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toEqual(["Invalid email"]);
        });
    });

    test.sequential("must return invalid minimum password char", async () => {
      await request(server, `${rootPath}/login`, "post")
        .send({ email, password: "12345" })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toEqual(["String must contain at least 6 character(s)"]);
        });
    });

    test.sequential("must return invalid maximum password char", async () => {
      await request(server, `${rootPath}/login`, "post")
        .send({ email, password: "a".repeat(129) })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body).toEqual(["String must contain at most 128 character(s)"]);
        });
    });

    test.sequential("must login user", async () => {
      await request(server, `${rootPath}/login`, "post")
        .send({ email, password })
        .expect(httpStatus.OK)
        .expect((response) => {
          expect(response.body.id).toBeDefined();
          expect(response.body.email).toBeDefined();
          expect(response.body.created_at).toBeDefined();
          expect(response.body.password).not.toBeDefined();
        });
    });

    test.sequential("must return unauthorized", async () => {
      await request(server, `${rootPath}/login`, "post")
        .send({ email: "wrong@test.com", password })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe.sequential("POST: /v1/user/logout", () => {
    let headers: Record<string, string>;

    beforeEach(async () => {
      const response = await request(server, `${rootPath}/login`, "post").send({ email, password });
      headers = response.header;
    });

    test("must remove authorization header and jwt cookie from response", async () => {
      await requestWithCookie(
        server,
        `${rootPath}/logout`,
        "post",
        headers["set-cookie"] as unknown as string[],
      )
        .expect(httpStatus.OK)
        .expect((response) => {
          expect(response.header["authorization"]).not.toBeDefined();
          expect(response.header["set-cookie"]).not.toBeDefined();
        });
    });
  });

  describe.sequential("GET: /v1/user", () => {
    let headers: Record<string, string>;

    beforeEach(async () => {
      const response = await request(server, `${rootPath}/login`, "post").send({ email, password });
      headers = response.header;
    });

    test.sequential("must return user", async () => {
      await requestWithHeaders(server, rootPath, "get", headers["authorization"])
        .expect(httpStatus.OK)
        .expect((response) => {
          expect(response.body.id).toBeDefined();
          expect(response.body.email).toBeDefined();
          expect(response.body.created_at).toBeDefined();
          expect(response.body.password).not.toBeDefined();
        });
    });

    test.sequential("must return unauthorized", async () => {
      await request(server, rootPath, "get").expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe.sequential("DELETE: /v1/user", () => {
    test.sequential("must delete user with header token", async () => {
      const response = await request(server, `${rootPath}/login`, "post").send({ email, password });
      const token = response.header["authorization"];

      await requestWithHeaders(server, rootPath, "delete", token)
        .expect(httpStatus.NO_CONTENT)
        .expect((response) => {
          expect(response.header["authorization"]).not.toBeDefined();
          expect(response.header["set-cookie"]).not.toBeDefined();
        });
    });

    test.sequential("must return unauthorized", async () => {
      await request(server, rootPath, "delete").expect(httpStatus.UNAUTHORIZED);
    });
  });
});
