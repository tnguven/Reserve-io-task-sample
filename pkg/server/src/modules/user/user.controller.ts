import type { Response } from "express";
import type { Logger } from "pino";
import type { AuthServiceType } from "../auth/auth.services";
import type { UserServiceType } from "./user.service";
import type { ReqObj, ResObj } from "../../types";
import type { UserCreateInput } from "./user.validation";

import httpStatus from "http-status"; // keep status as modules because of all static with no logic

export type DepsType = {
  userService: UserServiceType;
  authService: AuthServiceType;
  logger: Logger;
};

export const makeGetUser =
  ({ userService, logger }: DepsType) =>
  async (req: ReqObj): Promise<ResObj> => {
    try {
      const user = await userService.getUserById(req.user?.id as string);
      if (user === null) {
        return {
          statusCode: httpStatus.UNAUTHORIZED,
        };
      }
      return {
        statusCode: httpStatus.OK,
        body: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
      };
    } catch (err) {
      logger.error({ err }, "GetUser: get user failure");
      throw err;
    }
  };

export const makeSignInUser =
  ({ userService, logger }: DepsType) =>
  async (req: ReqObj<UserCreateInput>): Promise<ResObj> => {
    try {
      if (await userService.isEmailExist(req.body.email)) {
        logger.warn({ email: req.body.email }, "SignInUser: User already exist");
        return {
          statusCode: httpStatus.CONFLICT,
        };
      }
      const user = await userService.createUser(req.body);
      return {
        statusCode: httpStatus.CREATED,
        body: user,
      };
    } catch (err) {
      logger.error({ err }, "SignInUser: an error occur while creating a new user");
      throw err;
    }
  };

export const makeLoginUser =
  ({ userService, authService, logger }: DepsType) =>
  async (req: ReqObj<UserCreateInput>, res: Response): Promise<ResObj> => {
    const { email, password } = req.body;
    try {
      const user = await userService.getUserByEmailPassword(email, password);
      if (user === null)
        return {
          statusCode: httpStatus.UNAUTHORIZED,
        };

      authService.setAuthentication(res, authService.generateToken(user.id));

      return {
        statusCode: httpStatus.OK,
        body: {
          id: user.id,
          created_at: user.created_at,
          email: user.email,
        },
      };
    } catch (err) {
      logger.error({ err }, "LoginUser: an error occur while login user");
      throw err;
    }
  };

export const makeLogoutUser =
  ({ authService }: DepsType) =>
  (_req: ReqObj, res: Response): ResObj => {
    authService.removeAuthentication(res);
    return {
      statusCode: httpStatus.OK,
    };
  };

export const makeDeleteUserByID =
  ({ userService, authService, logger }: DepsType) =>
  async (req: ReqObj, res: Response): Promise<ResObj> => {
    const id = req.user?.id;
    if (!id) return { statusCode: httpStatus.UNAUTHORIZED };

    try {
      const result = await userService.deleteUserById(id);
      if (result === null) {
        logger.warn({ id }, "DeleteUserByID: user not found");
        return {
          statusCode: httpStatus.UNPROCESSABLE_ENTITY,
        };
      }

      logger.info({ id }, "DeleteUserByID: user deleted");
      return {
        statusCode: httpStatus.NO_CONTENT,
      };
    } catch (err) {
      logger.error({ id, err }, "DeleteUserByID: an error occur while deleting the user");
      throw err;
    } finally {
      authService.removeAuthentication(res);
    }
  };
