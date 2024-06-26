import type { Request } from "express";
import type { User } from "./modules/user/user.model";

declare module "express" {
  interface Request {
    secret?: string | undefined;
    cookies: Record<string, any>;
    signedCookies: Record<string, any>;
    user?: User;
  }
}

export type QueryType = { [key: string]: undefined | string | string[] | QueryType | QueryType[] };

export type ParamType = Record<string, string>;

export type EmptyObj = Record<string, never>;

export type ReqObj<
  B extends object = any,
  P extends ParamType = EmptyObj,
  Q extends QueryType = EmptyObj,
> = Request<P, any, B, Q, Record<string, any>>;

export type ResObj = {
  statusCode: number;
  body?: Record<string, unknown> | Record<string, unknown>[] | string[];
  headers?: Record<string, string>;
  redirect?: string;
};
