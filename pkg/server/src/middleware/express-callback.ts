import type { Response, NextFunction } from "express";
import type { EmptyObj, ParamType, QueryType, ReqObj, ResObj } from "../types";
import httpStatus from "http-status";
import { logger } from "../logger";

// For standardize the response, everything will be a json
export function makeExpressCallback<
  B extends object = never,
  P extends ParamType = EmptyObj,
  Q extends QueryType = EmptyObj,
>(controller: (req: ReqObj<B, P, Q>, res: Response) => Promise<ResObj> | ResObj) {
  return async function expressCallback(req: ReqObj<B, P, Q>, res: Response, _next: NextFunction) {
    try {
      const httpResponse = await controller(req, res);

      res.status(httpResponse.statusCode);
      res.set({
        "Content-type": "application/json",
        ...(httpResponse.headers && httpResponse.headers),
      });

      if (httpResponse?.redirect) return res.redirect(httpResponse.redirect);

      res.type("json");
      res.send(httpResponse?.body ?? { status: httpResponse.statusCode });
    } catch (err) {
      logger.error(err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: "An unknown error occurred." });
    }
  };
}
