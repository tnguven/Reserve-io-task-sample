import { Router } from "express";
import { makeExpressCallback } from "../middleware/express-callback";
import {
  createEvent,
  getEvent,
  getEvents,
  getSeats,
  holdSeat,
  reserveEvent,
  refreshHold,
  CreateEventSchema,
  GetEventIdParamSchema,
  HoldEventSchema,
} from "../modules/event/event.module";
import { validate } from "../middleware/validate";
import { withRateLimit } from "../middleware/rate-limit";
import { EmptyObj } from "../types";
import type { CreateEventInput } from "../modules/event/event.validate";

export const eventsRouter = Router();

eventsRouter
  .route("/")
  .get(makeExpressCallback(getEvents))
  .post(withRateLimit(), validate(CreateEventSchema), makeExpressCallback<CreateEventInput>(createEvent));

eventsRouter
  .route("/:eventId")
  .get(validate(GetEventIdParamSchema), makeExpressCallback<EmptyObj, { eventId: string }>(getEvent));

eventsRouter
  .route("/:eventId/seats")
  .get(validate(GetEventIdParamSchema), makeExpressCallback<EmptyObj, { eventId: string }>(getSeats));

eventsRouter
  .route("/:eventId/seats/:seatId/hold")
  .put(
    validate(HoldEventSchema),
    makeExpressCallback<EmptyObj, { seatId: string; eventId: string }>(holdSeat),
  );

eventsRouter
  .route("/:eventId/seats/:seatId/reserve")
  .put(
    validate(HoldEventSchema),
    makeExpressCallback<EmptyObj, { seatId: string; eventId: string }>(reserveEvent),
  );

eventsRouter
  .route("/:eventId/seats/:seatId/refresh")
  .put(
    validate(HoldEventSchema),
    makeExpressCallback<EmptyObj, { seatId: string; eventId: string }>(refreshHold),
  );
