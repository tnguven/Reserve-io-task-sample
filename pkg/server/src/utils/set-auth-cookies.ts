import type { Response } from "express";

import { serialize } from "cookie";

export const cookieTokenKey = "JWToken";

export const setAuthCookies = (res: Response, token: string, maxAge: number) => {
  res.setHeader(
    "Set-Cookie",
    serialize(cookieTokenKey, token, {
      httpOnly: true,
      secure: true,
      maxAge,
      sameSite: "strict",
      path: "/",
    }),
  );
};

export const removeAuthCookie = (res: Response) => {
  res.clearCookie(cookieTokenKey);
  res.removeHeader("set-cookie");
};

export type SetAuthCookies = typeof setAuthCookies;
export type RemoveAuthCookie = typeof removeAuthCookie;
