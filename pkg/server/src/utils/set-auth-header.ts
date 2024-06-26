import type { Response } from "express";

export const setAuthorizationHeader = (res: Response, token: string) => {
   res.header("Authorization", `Bearer ${token}`)
}

export const removeAuthorizationHeader = (res: Response) => {
   res.removeHeader("Authorization");
}

export type SetAuthorizationHeader = typeof setAuthorizationHeader;
export type RemoveAuthorizationHeader = typeof removeAuthorizationHeader;