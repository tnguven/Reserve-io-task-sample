import httpStatus from "http-status";
import type { Request, Response, NextFunction } from "express";
import { Schema, ZodError } from "zod";
import { logger } from "../logger";
import { ZodIssue } from "zod/lib/ZodError";

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (err) {
      logger.warn(err);
      if (err instanceof ZodError) return res.status(httpStatus.BAD_REQUEST).send(formatError(err.errors));
      return res.status(httpStatus.BAD_REQUEST);
    }
  };
}

export const formatError = (errors: ZodIssue[]) => {
  return errors.map(({ message, path }) => {
    if (message === "Required") return `${message} ${path.join(".")}`;
    return message;
  });
};
