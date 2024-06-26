import { describe, test, expect, vi, beforeAll } from "vitest";

import {
  makeCreateEvent,
  makeGetEvent,
  makeGetEvents,
  makeGetSeats,
  makeHoldSeat,
  type DepsType,
} from "./event.controller";
import type { EmptyObj, ReqObj } from "types";
import type { CreateEventInput } from "./event.validate";

describe("Event Controller", () => {
  const limitsConfig = {
    maxHoldsPerUser: 2,
  };
  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
  };
  const mockEventService = {
    createEvent: vi.fn(),
    getAllEvents: vi.fn(),
    getSeatsByEventId: vi.fn(),
    getEventById: vi.fn(),
    isExistingSeat: vi.fn(),
    getUserHolds: vi.fn(),
    seatNotAvailable: vi.fn(),
    holdSeat: vi.fn(),
    getHeldBy: vi.fn(),
    reserveSeat: vi.fn(),
    refreshHeldSeat: vi.fn(),
  };
  const deps = {
    logger: mockLogger,
    eventService: mockEventService,
    limitsConfig,
  } as unknown as DepsType;
  const eventInput = {
    title: "title",
    content: "content",
    total_seats: 10,
  };

  describe("makeCreateEvent", () => {
    let getEvent: ReturnType<typeof makeGetEvent>;

    beforeAll(() => {
      getEvent = makeGetEvent(deps);
    });

    test("must return statusCode 201 and event", async () => {
      mockEventService.getEventById.mockResolvedValue(eventInput);

      const result = await getEvent({ params: { eventId: "eventId" } } as ReqObj<
        EmptyObj,
        { eventId: string }
      >);

      expect(mockEventService.getEventById).toHaveBeenCalledWith("eventId");
      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual({ title: "title", content: "content", total_seats: 10 });
    });

    test("must return statusCode 404", async () => {
      mockEventService.getEventById.mockResolvedValue(null);

      const result = await getEvent({ params: { eventId: "eventId" } } as ReqObj<
        EmptyObj,
        { eventId: string }
      >);

      expect(result.statusCode).toBe(404);
    });
  });

  describe("makeCreateEvent", () => {
    let createEvent: ReturnType<typeof makeCreateEvent>;

    beforeAll(() => {
      createEvent = makeCreateEvent(deps);
    });

    test("must return statusCode 201 and event", async () => {
      const created_at = new Date().toISOString();
      mockEventService.createEvent.mockResolvedValue({
        ...eventInput,
        created_at,
        id: "id",
        seats: ["seatId-1"],
      });
      const result = await createEvent({ body: eventInput } as ReqObj<CreateEventInput>);

      expect(mockEventService.createEvent).toHaveBeenCalledWith(eventInput);
      expect(result.statusCode).toBe(201);
      expect(result.body).toEqual({ ...eventInput, created_at, id: "id", seats: ["seatId-1"] });
    });
  });

  describe("makeGetEvents", () => {
    let getEvents: ReturnType<typeof makeGetEvents>;

    beforeAll(() => {
      getEvents = makeGetEvents(deps);
    });

    test("must return statusCode 200 and events", async () => {
      const created_at = new Date().toISOString();
      mockEventService.getAllEvents.mockResolvedValue([{ ...eventInput, created_at, id: "id" }]);
      const result = await getEvents();

      expect(mockEventService.getAllEvents).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual([{ ...eventInput, created_at, id: "id" }]);
    });
  });

  describe("makeGetSeats", () => {
    let getSeats: ReturnType<typeof makeGetSeats>;

    beforeAll(() => {
      getSeats = makeGetSeats(deps);
    });

    test("must return statusCode 200 and events", async () => {
      mockEventService.getSeatsByEventId.mockResolvedValue(["seatId-1", "seatId-2"]);
      const result = await getSeats({ params: { eventId: "eventId" }, user: { id: "id" } } as ReqObj<
        EmptyObj,
        { eventId: string }
      >);

      expect(mockEventService.getSeatsByEventId).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual(["seatId-1", "seatId-2"]);
    });

    test("must return statusCode 404", async () => {
      mockEventService.getSeatsByEventId.mockResolvedValue(null);
      const result = await getSeats({ params: { eventId: "eventId" }, user: { id: "id" } } as ReqObj<
        EmptyObj,
        { eventId: string }
      >);

      expect(mockEventService.getSeatsByEventId).toHaveBeenCalled();
      expect(result.statusCode).toBe(404);
    });
  });

  describe("makeHoldSeat", () => {
    let holdSeat: ReturnType<typeof makeHoldSeat>;

    beforeAll(() => {
      holdSeat = makeHoldSeat(deps);
    });

    test("must return statusCode 404 when the seat does not exist", async () => {
      mockEventService.isExistingSeat.mockResolvedValue(false);
      const result = await holdSeat({ params: { eventId: "eventId", seatId: "seatId" } } as ReqObj<
        EmptyObj,
        { seatId: string; eventId: string }
      >);

      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual({ msg: `Seat seatId does not exist.` });
    });

    test("must return statusCode 404 when the seat does not exist", async () => {
      mockEventService.isExistingSeat.mockResolvedValue(true);
      mockEventService.getUserHolds.mockResolvedValue([1, 2]);
      const result = await holdSeat({ params: { eventId: "eventId", seatId: "seatId" } } as ReqObj<
        EmptyObj,
        { seatId: string; eventId: string }
      >);

      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual({ msg: `User can hold a maximum of ${limitsConfig.maxHoldsPerUser} seats.` });
    });

    // test("must return statusCode 200 and events", async () => {
    //   mockEventService.isExistingSeat.mockResolvedValue(true);

    //   const result = await holdSeat({ params: { eventId: "eventId", seatId: "seatId" } } as ReqObj<
    //     EmptyObj,
    //     { seatId: string; eventId: string }
    //   >);

    //   expect(mockEventService.getSeatsByEventId).toHaveBeenCalled();
    //   expect(result.statusCode).toBe(201);
    //   expect(result.body).toEqual(["seatId-1", "seatId-2"]);
    // });
  });
});
