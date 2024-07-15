import { z } from "zod";

export type CreateEventInput = {
  title: string;
  content: string;
  total_seats: number;
};

export const CreateEventSchema = z.object({
  body: z.object({
    title: z.string().max(255),
    content: z.string(),
    total_seats: z.number().min(10).max(1000),
  }),
});

export const GetEventIdParamSchema = z.object({
  params: z.object({
    eventId: z.string().uuid(),
  }),
});

export const HoldEventSchema = z.object({
  params: z.object({
    eventId: z.string().uuid(),
    seatId: z.string(),
  }),
});

export const GetEventsQuerySchema = z.object({
  query: z.object({
    limit: z.number().max(100).default(20),
    offset: z.number().default(0)
  })
})