import { client as dbClient } from "../../database/redis";
import { hashPassword } from "../../utils/hash-password";
import { generateId } from "../../utils/id-provider";
import { logger } from "../../logger";
import { secrets } from "../../configs";
import {
  makeSignInUser,
  makeGetUser,
  makeLoginUser,
  makeLogoutUser,
  makeDeleteUserByID,
} from "./user.controller";
import { makeUserService } from "./user.service";
import { authService } from "../auth/auth.module";

export { LoginSchema } from "./user.validation";

const userService = makeUserService({ dbClient, hashPassword, generateId, secrets });
const dependencies = { userService, authService, logger };

export const signInUser = makeSignInUser(dependencies);
export const getUser = makeGetUser(dependencies);
export const loginUser = makeLoginUser(dependencies);
export const logoutUser = makeLogoutUser(dependencies);
export const deleteUserByID = makeDeleteUserByID(dependencies);
