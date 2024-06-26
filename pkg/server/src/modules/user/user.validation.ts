import { z } from "zod";

export type UserCreateInput = {
  email: string;
  password: string;
}

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
  }),
});
