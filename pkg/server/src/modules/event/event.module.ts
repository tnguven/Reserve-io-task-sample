import { client as dbClient } from "../../database/redis";
import {
  makeCreateEvent,
  makeGetEvent,
  makeGetEvents,
  makeGetSeats,
  makeHoldSeat,
  makeReserveEvent,
  makeRefreshHold
} from "./event.controller";
import { makeEventService } from "./event.service";
import { generateId } from "../../utils/id-provider";
import { logger } from "../../logger";
import { limitsConfig } from "../../configs";

const eventService = makeEventService({ dbClient, generateId });
const dependencies = { eventService, logger, limitsConfig };

export const createEvent = makeCreateEvent(dependencies);
export const getEvent = makeGetEvent(dependencies);
export const getEvents = makeGetEvents(dependencies);
export const getSeats = makeGetSeats(dependencies);
export const holdSeat = makeHoldSeat(dependencies);
export const reserveEvent = makeReserveEvent(dependencies);
export const refreshHold = makeRefreshHold(dependencies);

export { CreateEventSchema, GetEventIdParamSchema, HoldEventSchema } from "./event.validate";
