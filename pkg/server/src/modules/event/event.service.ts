import type { DbClient } from "../../database/redis";
import type { CreateEventInput } from "./event.validate";
import type { Event } from "./event.model";
import { limitsConfig } from "../../configs";

export type EventServiceType = ReturnType<typeof makeEventService>;

export type DepsType = {
  dbClient: DbClient;
  generateId: () => string;
};

export const makeEventService = ({ dbClient, generateId }: DepsType) => ({
  async createEvent({ title, content, total_seats }: CreateEventInput): Promise<Event> {
    const eventId = generateId();
    const event = { id: eventId, title, content, total_seats, created_at: new Date().toISOString() };
    const seats = Array.from({ length: total_seats }, (_, i) => ({
      score: i + 1,
      value: `seatId-${i + 1}`,
    }));

    const multi = dbClient.multi();
    multi.hSet(`event:${eventId}:info`, event);
    multi.zAdd("events", { score: Date.now(), value: eventId });
    multi.zAdd(`event:${eventId}:seats`, seats);
    await multi.exec();

    return { ...event, seats: seats.map(({ value }) => value) };
  },

  async getEventById(eventId: string): Promise<null | Event> {
    const event = (await dbClient.hGetAll(`event:${eventId}:info`)) as unknown as Event;

    if (!Object.keys(event).length) return null;

    return { ...event, total_seats: Number(event.total_seats) };
  },

  async getAllEvents() {
    const eventIds = await dbClient.zRange("events", 0, -1);
    const events = [];

    for (const eventId of eventIds) {
      const eventInfo = await dbClient.hGetAll(`event:${eventId}:info`);
      if (eventInfo.title) {
        events.push(eventInfo);
      }
    }

    return events.map((event) => ({ ...event, total_seats: Number(event.total_seats) }));
  },

  async getSeatsByEventId(eventId: string, userId: string): Promise<null | string[]> {
    const seats = await dbClient.zRange(`event:${eventId}:seats`, 0, -1);

    if (!seats.length) return null;

    const reservedSeatsIds = await dbClient.sMembers(`event:${eventId}:reserved`);
    const availableSeats: string[] = [];

    for (const seatId of seats) {
      const isHeld = await this.getHeldBy(eventId, userId, seatId);
      if (!isHeld && !reservedSeatsIds.includes(seatId)) {
        availableSeats.push(seatId);
      }
    }

    return availableSeats;
  },

  async getUserHolds(userId: string, eventId: string): Promise<string[]> {
    return dbClient.sMembers(`user:${userId}:holds:${eventId}`);
  },

  async isExistingSeat(eventId: string, seatId: string): Promise<boolean> {
    return !!(await dbClient.zScore(`event:${eventId}:seats`, seatId));
  },

  async seatNotAvailable(eventId: string, userId: string, seatId: string): Promise<boolean> {
    const [isHeld, isReserved] = await Promise.all([
      this.getHeldBy(eventId, userId, seatId),
      dbClient.sIsMember(`event:${eventId}:reserved`, seatId),
    ]);
    return !!isHeld || isReserved;
  },

  async holdSeat(userId: string, eventId: string, seatId: string): Promise<void> {
    const multi = dbClient.multi();
    multi.sAdd(`user:${userId}:holds:${eventId}`, seatId);
    multi.setEx(`hold:${eventId}:${userId}:${seatId}`, limitsConfig.holdDuration, userId);
    await multi.exec();
  },

  getHeldBy(eventId: string, userId: string, seatId: string): Promise<string | null> {
    return dbClient.get(`hold:${eventId}:${userId}:${seatId}`);
  },

  async reserveSeat(userId: string, eventId: string, seatId: string): Promise<void> {
    const multi = dbClient.multi();
    // Add held seat to the reserved list
    multi.sAdd(`event:${eventId}:reserved`, seatId);
    // remove user hold from holds
    multi.sRem(`user:${userId}:holds:${eventId}`, seatId);
    // remove the hold with expire from expiration
    multi.del(`hold:${eventId}:${userId}:${seatId}`);
    await multi.exec();
  },

  async refreshHeldSeat(eventId: string, userId: string, seatId: string): Promise<void> {
    await dbClient.expire(`hold:${eventId}:${userId}:${seatId}`, limitsConfig.holdDuration);
  },
});
