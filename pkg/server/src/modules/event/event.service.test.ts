import { describe, test, expect, vi, beforeAll, Mock, beforeEach, afterEach, afterAll } from "vitest";

import { makeEventService, type DepsType, type EventServiceType } from "./event.service";

describe("Event service", () => {
  const deps = {
    dbClient: {
      multi: vi.fn().mockImplementation(() => ({
        hSet: vi.fn(),
        zAdd: vi.fn(),
        exec: vi.fn(),
      })),
      hGetAll: vi.fn(),
      zRange: vi.fn(),
      sMembers: vi.fn(),
      get: vi.fn(),
    },
    generateId: vi.fn(),
  } as unknown as DepsType;
  let eventService: EventServiceType;

  beforeAll(() => {
    eventService = makeEventService(deps);
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("createEvent", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("must return event with seats field", async () => {
      const date = new Date();
      vi.setSystemTime(date);
      (deps.generateId as Mock).mockReturnValue("uuid");

      const result = await eventService.createEvent({ title: "title", content: "content", total_seats: 2 });

      expect(result).toEqual({
        id: "uuid",
        title: "title",
        content: "content",
        total_seats: 2,
        created_at: date.toISOString(),
        seats: ["seatId-1", "seatId-2"],
      });
    });
  });

  describe("getEventById", () => {
    test("must return null if the response object is empty", async () => {
      (deps.dbClient.hGetAll as Mock).mockResolvedValue({});

      const result = await eventService.getEventById("eventId");

      expect(result).toEqual(null);
    });
    test("must return event", async () => {
      (deps.dbClient.hGetAll as Mock).mockResolvedValue({
        id: "uuid",
        title: "title",
        content: "content",
        total_seats: "2",
      });

      const result = await eventService.getEventById("eventId");

      expect(result).toEqual({
        id: "uuid",
        title: "title",
        content: "content",
        total_seats: 2,
      });
    });
  });

  describe("getAllEvents", () => {
    test("must return event", async () => {
      (deps.dbClient.zRange as Mock).mockResolvedValue(["uuid", "uuid2"]);
      (deps.dbClient.hGetAll as Mock)
        .mockResolvedValueOnce({
          id: "uuid",
          title: "title",
          content: "content",
          total_seats: "2",
        })
        .mockResolvedValueOnce({
          id: "uuid2",
          title: "title2",
          content: "content2",
          total_seats: "2",
        });

      const result = await eventService.getAllEvents();

      expect(result).toEqual([
        {
          id: "uuid",
          title: "title",
          content: "content",
          total_seats: 2,
        },
        {
          id: "uuid2",
          title: "title2",
          content: "content2",
          total_seats: 2,
        },
      ]);
    });
  });

  describe.only("getSeatsByEventId", () => {
    test("must return null when there is event or seat", async () => {
      (deps.dbClient.zRange as Mock).mockResolvedValue([]);

      const result = await eventService.getSeatsByEventId("eventId", "userId");

      expect(result).toEqual(null);
    });

    test("must return un held and reserved seats", async () => {
      (deps.dbClient.zRange as Mock).mockResolvedValue(["seatId-1", "seatId-2", "seatId-3"]);
      (deps.dbClient.sMembers as Mock).mockResolvedValue(["seatId-1"]);
      (deps.dbClient.get as Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce("seatId-3");

      const result = await eventService.getSeatsByEventId("eventId", "userId");

      expect(result).toEqual(["seatId-2"]);
    });
  });
});
