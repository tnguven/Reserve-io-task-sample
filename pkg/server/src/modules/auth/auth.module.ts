import { client } from "../../database/redis";
import { secrets } from "../../configs";
import { generateAccessToken, makeVerifyJwtToken } from "../../utils/jwt-helper";
import { removeAuthCookie, setAuthCookies } from "../../utils/set-auth-cookies";
import { setAuthorizationHeader, removeAuthorizationHeader } from "../../utils/set-auth-header";

import { makeAuthService } from "./auth.services";
import { User } from "modules/user/user.model";

const verifyJwtToken = makeVerifyJwtToken<User>(secrets.token_secret);

export const authService = makeAuthService({
  setAuthCookies,
  removeAuthCookie,
  generateAccessToken,
  setAuthorizationHeader,
  removeAuthorizationHeader,
  verifyJwtToken,
  secrets,
  dbClient: client,
});
