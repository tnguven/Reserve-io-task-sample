import type { Response } from "express";
import type { DbClient } from "../../database/redis";
import type { GenerateAccessToken } from "../../utils/jwt-helper";
import type { RemoveAuthCookie, SetAuthCookies } from "../../utils/set-auth-cookies";
import type { RemoveAuthorizationHeader, SetAuthorizationHeader } from "../../utils/set-auth-header";
import type { Secrets } from "../../configs";
import type { UserModel, User } from "../user/user.model";

type PropsType = {
  dbClient: DbClient;
  generateAccessToken: GenerateAccessToken;
  setAuthorizationHeader: SetAuthorizationHeader;
  removeAuthorizationHeader: RemoveAuthorizationHeader;
  setAuthCookies: SetAuthCookies;
  removeAuthCookie: RemoveAuthCookie;
  verifyJwtToken: (token: string) => Promise<User>;
  secrets: Secrets;
};

export type AuthServiceType = ReturnType<typeof makeAuthService>;

export const makeAuthService = ({
  setAuthCookies,
  removeAuthCookie,
  generateAccessToken,
  setAuthorizationHeader,
  removeAuthorizationHeader,
  verifyJwtToken,
  secrets,
  dbClient,
}: PropsType) => ({
  setAuthentication(res: Response, accessToken: string) {
    setAuthCookies(res, accessToken, secrets.tokenMaxAge);
    setAuthorizationHeader(res, accessToken);
  },

  async verifyAuthentication(token: string): Promise<string> {
    const { id } = await verifyJwtToken(token);
    const user = (await dbClient.hGetAll(`user:${id}`)) as unknown as UserModel;

    if (user === null) return Promise.reject("User not found");

    return id;
  },

  generateToken(id: string, duration: number = secrets.tokenMaxAge): string {
    return generateAccessToken({ id }, secrets.token_secret, `${duration}s`);
  },

  removeAuthentication(res: Response) {
    removeAuthCookie(res);
    removeAuthorizationHeader(res);
  },
});
