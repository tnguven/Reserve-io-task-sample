import { Router } from "express";

import { validate } from "../middleware/validate";
import {
  signInUser,
  loginUser,
  getUser,
  logoutUser,
  deleteUserByID,
  LoginSchema,
} from "../modules/user/user.module";
import { makeExpressCallback } from "../middleware/express-callback";
import { withAuthentication } from "../middleware/with-authentication";
import { withRateLimit } from "../middleware/rate-limit";

export const userRouter = Router();

userRouter
  .route("/")
  .get(withAuthentication, makeExpressCallback(getUser))
  .delete(withAuthentication, makeExpressCallback(deleteUserByID));

userRouter
  .route("/signin")
  .post(
    withRateLimit(),
    validate(LoginSchema),
    makeExpressCallback<{ email: string; password: string }>(signInUser),
  );

userRouter
  .route("/login")
  .post(validate(LoginSchema), makeExpressCallback<{ email: string; password: string }>(loginUser));

userRouter.route("/logout").post(withAuthentication, makeExpressCallback(logoutUser));
