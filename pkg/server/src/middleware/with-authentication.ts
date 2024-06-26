import type { Request, Response, NextFunction } from "express";

import { cookieTokenKey } from "../utils/set-auth-cookies";
import { authService } from "../modules/auth/auth.module";
import { logger } from "../logger";
import httpStatus from "http-status";

export const getTokenFromHeader = (token?: string) => token && token.replace("Bearer ", "");

export async function withAuthentication(req: Request, res: Response, next: NextFunction) {
  const token: string = getTokenFromHeader(req.headers?.["authorization"]) || req.cookies?.[cookieTokenKey];

  if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED);

  try {
    const userId = await authService.verifyAuthentication(token);
    req.user = { id: userId };

    // Refreshing the token for every valid access. for the sake of this task I've just keep it simple
    const newToken = authService.generateToken(userId);
    authService.setAuthentication(res, newToken);
  } catch (err) {
    logger.error(err);
    authService.removeAuthentication(res);
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }

  next();
}
