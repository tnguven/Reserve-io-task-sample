import { describe, test, expect, afterAll, beforeAll } from "vitest";
import httpStatus from "http-status";
import type { Express } from "express";

import { requestWithHeaders, request, wait } from "./tool";
import { connect, type DbClient } from "../src/database/redis";
import { Event } from "../src/modules/event/event.model";

const email = "test1@test.com";
const password = "secret1";
const event = {
  title: "Title",
  content: "Lorem Ipsum",
  total_seats: 10,
};

describe("EVENTS router", () => {
  const rootPath = "/v1/events";
  let client: DbClient;
  let subClient: DbClient;
  let server: Express;
  let headers: Record<string, string>;
  let newEvent: Event;

  beforeAll(async () => {
    const { redisClient, subscribeClient } = await connect();
    client = redisClient;
    subClient = subscribeClient;
    await client.flushAll();
    const { server: app } = await import("../src/server"); // lazy
    server = app;
    const res = await getUserAuth(server, { password, email });
    headers = res.header;
  });

  afterAll(async () => {
    await client.flushAll();
    await Promise.all([client.quit(), subClient.quit()]);
  });

  describe.sequential("POST: /v1/events", () => {
    test("must return unauthorized", async () => {
      await request(server, rootPath, "post").expect(httpStatus.UNAUTHORIZED);
    });

    test("must return required title", async () => {
      await requestWithHeaders(server, rootPath, "post", headers["authorization"])
        .send({ ...event, title: undefined })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body[0]).toBe("Required body.title");
        });
    });

    test("must return invalid title", async () => {
      await requestWithHeaders(server, rootPath, "post", headers["authorization"])
        .send({ ...event, title: "title".repeat(256) })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body[0]).toBe("String must contain at most 255 character(s)");
        });
    });

    test("must return required content", async () => {
      await requestWithHeaders(server, rootPath, "post", headers["authorization"])
        .send({ ...event, content: undefined })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body[0]).toBe("Required body.content");
        });
    });

    test("must return required total_seats", async () => {
      await requestWithHeaders(server, rootPath, "post", headers["authorization"])
        .send({ ...event, total_seats: undefined })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body[0]).toBe("Required body.total_seats");
        });
    });

    test("must return invalid total_seats min value", async () => {
      await requestWithHeaders(server, rootPath, "post", headers["authorization"])
        .send({ ...event, total_seats: 9 })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body[0]).toBe("Number must be greater than or equal to 10");
        });
    });

    test("must return invalid total_seats max value", async () => {
      await requestWithHeaders(server, rootPath, "post", headers["authorization"])
        .send({ ...event, total_seats: 1001 })
        .expect(httpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body[0]).toBe("Number must be less than or equal to 1000");
        });
    });

    test("must create new event with seats", async () => {
      await requestWithHeaders(server, rootPath, "post", headers["authorization"])
        .send(event)
        .expect(httpStatus.CREATED)
        .expect((response) => {
          newEvent = response.body;
          expect(response.body.title).toBeDefined();
          expect(response.body.content).toBeDefined();
          expect(response.body.created_at).toBeDefined();
          expect(response.body.seats).toEqual([
            "seatId-1",
            "seatId-2",
            "seatId-3",
            "seatId-4",
            "seatId-5",
            "seatId-6",
            "seatId-7",
            "seatId-8",
            "seatId-9",
            "seatId-10",
          ]);
        });
    });
  });

  describe.sequential("GET: /v1/events", () => {
    test("must return unauthorized", async () => {
      await request(server, rootPath, "get").expect(httpStatus.UNAUTHORIZED);
    });

    test("must return events", async () => {
      await requestWithHeaders(server, rootPath, "get", headers["authorization"])
        .expect(httpStatus.OK)
        .expect((response) => {
          expect(response.body[0].id).toBeDefined();
          expect(response.body[0].title).toBeDefined();
          expect(response.body[0].content).toBeDefined();
          expect(response.body[0].created_at).toBeDefined();
          expect(response.body[0].total_seats).toBe(10);
        });
    });
  });

  describe.sequential("GET: /v1/events/:eventId", () => {
    let newEvent: Event;

    beforeAll(async () => {
      const res = await requestWithHeaders(server, rootPath, "post", headers["authorization"]).send(event);
      newEvent = res.body;
    });

    test("must return unauthorized", async () => {
      await request(server, `${rootPath}/${newEvent.id}`, "get").expect(httpStatus.UNAUTHORIZED);
    });

    test("must return event", async () => {
      await requestWithHeaders(server, `${rootPath}/${newEvent.id}`, "get", headers["authorization"])
        .expect(httpStatus.OK)
        .expect((response) => {
          expect(response.body.id).toBeDefined();
          expect(response.body.title).toBeDefined();
          expect(response.body.content).toBeDefined();
          expect(response.body.created_at).toBeDefined();
          expect(response.body.total_seats).toBe(10);
        });
    });
  });

  describe.sequential("GET: /v1/events/:eventId/seats", () => {
    test("must return unauthorized", async () => {
      await request(server, `${rootPath}/${newEvent.id}/seats`, "get").expect(httpStatus.UNAUTHORIZED);
    });

    test("must return seats", async () => {
      await requestWithHeaders(server, `${rootPath}/${newEvent.id}/seats`, "get", headers["authorization"])
        .expect(httpStatus.OK)
        .expect((response) => {
          expect(response.body.length).toBe(10);
        });
    });
  });

  describe.sequential("Seats hold with limit and duration flow", () => {
    describe.sequential("PUT: /v1/events/:eventId/seats/:seatId/hold", () => {
      test("must return unauthorized", async () => {
        const seatId = newEvent?.seats?.[0];
        await request(server, `${rootPath}/${newEvent.id}/seats/${seatId}/hold`, "put").expect(
          httpStatus.UNAUTHORIZED,
        );
      });

      // hold limit has set via testing.env
      test.sequential(`must hold ${process.env.MAX_HOLDS_PER_USER} seats`, async () => {
        let index = 0;

        for (const seatId of newEvent?.seats as unknown as string[]) {
          const hasLimitedHold = index >= Number(process.env.MAX_HOLDS_PER_USER);
          index++;

          await requestWithHeaders(
            server,
            `${rootPath}/${newEvent.id}/seats/${seatId}/hold`,
            "put",
            headers["authorization"],
          )
            .expect(hasLimitedHold ? httpStatus.BAD_REQUEST : httpStatus.CREATED)
            .expect((response) => {
              expect(response.body.msg).toBeDefined();
            });

          if (hasLimitedHold) break;
        }
      });

      test.sequential("must return only available seats", async () => {
        await requestWithHeaders(server, `${rootPath}/${newEvent.id}/seats`, "get", headers["authorization"])
          .expect(httpStatus.OK)
          .expect((response) => {
            expect(response.body.length).toBe(8);
          });
      });

      test.sequential("must return all seats after hold duration end", async () => {
        await wait(Number(process.env.HOLD_DURATION) * 1100);
        await requestWithHeaders(server, `${rootPath}/${newEvent.id}/seats`, "get", headers["authorization"])
          .expect(httpStatus.OK)
          .expect((response) => {
            expect(response.body.length).toBe(10);
          });
      });

      test.sequential(
        `must hold another ${process.env.MAX_HOLDS_PER_USER} seats after hold duration expires`,
        async () => {
          let index = 0;

          for (const seatId of newEvent?.seats as unknown as string[]) {
            const hasLimitedHold = index >= Number(process.env.MAX_HOLDS_PER_USER);
            index++;

            await requestWithHeaders(
              server,
              `${rootPath}/${newEvent.id}/seats/${seatId}/hold`,
              "put",
              headers["authorization"],
            )
              .expect(hasLimitedHold ? httpStatus.BAD_REQUEST : httpStatus.CREATED)
              .expect((response) => {
                expect(response.body.msg).toBeDefined();
              });

            if (hasLimitedHold) break;
          }

          await wait(Number(process.env.HOLD_DURATION) * 1100); // wait until the hold duration end
        },
      );
    });
  });

  describe.sequential("Seats reserve and refresh hold flow", () => {
    let seatId = "";

    beforeAll(async () => {
      seatId = newEvent?.seats?.[0] as string;
      // hold the seat before reserve
      await requestWithHeaders(
        server,
        `${rootPath}/${newEvent.id}/seats/${seatId}/hold`,
        "put",
        headers["authorization"],
      ).expect(httpStatus.CREATED);
    });

    test("PUT: must return unauthorized reserve put", async () => {
      await request(server, `${rootPath}/${newEvent.id}/seats/${seatId}/reserve`, "put").expect(
        httpStatus.UNAUTHORIZED,
      );
    });

    test.sequential("PUT: /v1/events/:eventId/seats/:seatId/refresh must refresh duration", async () => {
      await requestWithHeaders(
        server,
        `${rootPath}/${newEvent.id}/seats/${seatId}/refresh`,
        "put",
        headers["authorization"],
      ).expect(httpStatus.OK);
    });

    test.sequential(`PUT: /v1/events/:eventId/seats/:seatId/reserve must reserve ${seatId}`, async () => {
      await requestWithHeaders(
        server,
        `${rootPath}/${newEvent.id}/seats/${seatId}/reserve`,
        "put",
        headers["authorization"],
      )
        .expect(httpStatus.CREATED)
        .expect((response) => {
          expect(response.body.msg).toContain(`Seat seatId-1 reserved for user`);
        });
    });

    test.sequential("PUT: /v1/events/:eventId/seats/:seatId/refresh must return 404", async () => {
      await requestWithHeaders(
        server,
        `${rootPath}/${newEvent.id}/seats/${seatId}/refresh`,
        "put",
        headers["authorization"],
      ).expect(httpStatus.NOT_FOUND);
    });

    test.sequential("must return available seats", async () => {
      await requestWithHeaders(server, `${rootPath}/${newEvent.id}/seats`, "get", headers["authorization"])
        .expect(httpStatus.OK)
        .expect((response) => {
          expect(response.body.length).toBe(9);
        });
    });
  });
});

const getUserAuth = async (server: Express, user: { email: string; password: string }) => {
  await request(server, "/v1/user/signin", "post").send(user);
  return request(server, "/v1/user/login", "post").send(user);
};
