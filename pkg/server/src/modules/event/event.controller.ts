import type { Logger } from "pino";
import type { EmptyObj, ReqObj } from "../../types";
import type { CreateEventInput } from "./event.validate";
import type { EventServiceType } from "./event.service";
import type { LimitsConfig } from "../../configs";

import httpStatus from "http-status";

export type DepsType = {
  eventService: EventServiceType;
  logger: Logger;
  limitsConfig: LimitsConfig;
};

export const makeCreateEvent =
  ({ logger, eventService }: DepsType) =>
  async (req: ReqObj<CreateEventInput>) => {
    try {
      const event = await eventService.createEvent(req.body);
      return {
        statusCode: httpStatus.CREATED,
        body: event,
      };
    } catch (err) {
      logger.error({ err }, "CreateEvent: an error occurred while creating event");
      throw err;
    }
  };

export const makeGetEvent =
  ({ logger, eventService }: DepsType) =>
  async (req: ReqObj<EmptyObj, { eventId: string }>) => {
    const { eventId } = req.params;
    try {
      const event = await eventService.getEventById(eventId);

      if (event === null) {
        logger.info({ eventId }, "GetEvent: event not found");
        return {
          statusCode: httpStatus.NOT_FOUND,
        };
      }

      return {
        statusCode: httpStatus.OK,
        body: event,
      };
    } catch (err) {
      logger.error({ err }, "GetEvent: an error occurred while getting event");
      throw err;
    }
  };

export const makeGetEvents =
  ({ logger, eventService }: DepsType) =>
  async () => {
    try {
      const events = await eventService.getAllEvents();
      return {
        statusCode: httpStatus.OK,
        body: events,
      };
    } catch (err) {
      logger.error({ err }, "GetEvents: an error occurred while getting events");
      throw err;
    }
  };

export const makeGetSeats =
  ({ logger, eventService }: DepsType) =>
  async (req: ReqObj<EmptyObj, { eventId: string }>) => {
    const { eventId } = req.params;
    const id = req.user?.id as string;
    try {
      const seats = await eventService.getSeatsByEventId(eventId, id);

      if (seats === null) {
        return {
          statusCode: httpStatus.NOT_FOUND,
        };
      }

      return {
        statusCode: httpStatus.OK,
        body: seats,
      };
    } catch (err) {
      logger.error({ err }, "GetSeats: error occurred while getting seats");
      throw err;
    }
  };

export const makeHoldSeat =
  ({ logger, eventService, limitsConfig }: DepsType) =>
  async (req: ReqObj<EmptyObj, { seatId: string; eventId: string }>) => {
    const { eventId, seatId } = req.params;
    const userId = req.user?.id as string;

    try {
      const isValidSeat = await eventService.isExistingSeat(eventId, seatId);
      if (!isValidSeat) {
        return {
          statusCode: httpStatus.NOT_FOUND,
          body: { msg: `Seat ${seatId} does not exist.` },
        };
      }

      const userHolds = await eventService.getUserHolds(userId, eventId);
      if (userHolds.length >= limitsConfig.maxHoldsPerUser) {
        return {
          statusCode: httpStatus.BAD_REQUEST,
          body: { msg: `User can hold a maximum of ${limitsConfig.maxHoldsPerUser} seats.` },
        };
      }
      if (await eventService.seatNotAvailable(eventId, userId, seatId)) {
        return {
          statusCode: httpStatus.BAD_REQUEST,
          body: { msg: `Seat ${seatId} not available.` },
        };
      }

      await eventService.holdSeat(userId, eventId, seatId);
      return {
        statusCode: httpStatus.CREATED,
        body: { msg: `Seat ${seatId} held for user ${userId}.` },
      };
    } catch (err) {
      logger.error({ err }, "holdEvent: an error occurred while hold event");
      throw err;
    }
  };

export const makeReserveEvent =
  ({ logger, eventService }: DepsType) =>
  async (req: ReqObj<EmptyObj, { seatId: string; eventId: string }>) => {
    const { eventId, seatId } = req.params;
    const userId = req.user?.id as string;

    try {
      const heldBy = await eventService.getHeldBy(eventId, userId, seatId);
      if (heldBy === null) {
        return {
          statusCode: httpStatus.NOT_FOUND,
          body: { msg: `Seat ${seatId} can not be found.` },
        };
      }
      if (heldBy !== userId) {
        return {
          statusCode: httpStatus.NOT_ACCEPTABLE,
          body: { msg: "Seat is not held by the user." },
        };
      }

      await eventService.reserveSeat(userId, eventId, seatId);
      return {
        statusCode: httpStatus.CREATED,
        body: { msg: `Seat ${seatId} reserved for user ${userId}.` },
      };
    } catch (err) {
      logger.error({ err }, "holdEvent: an error occurred while hold event");
      throw err;
    }
  };

export const makeRefreshHold =
  ({ logger, eventService }: DepsType) =>
  async (req: ReqObj<EmptyObj, { seatId: string; eventId: string }>) => {
    const { eventId, seatId } = req.params;
    const userId = req.user?.id as string;

    try {
      const heldBy = await eventService.getHeldBy(eventId, userId, seatId);
      if (heldBy === null) {
        return {
          statusCode: httpStatus.NOT_FOUND,
          body: { msg: `Seat ${seatId} can not be found.` },
        };
      }
      if (heldBy !== userId) {
        return {
          statusCode: httpStatus.NOT_ACCEPTABLE,
          body: { msg: `Seat is not held by the user: ${userId}` },
        };
      }

      await eventService.refreshHeldSeat(eventId, userId, seatId);
      return {
        statusCode: httpStatus.OK,
      };
    } catch (err) {
      logger.error({ err }, "refreshHold: an error occurred while refreshing held seat");
      throw err;
    }
  };
