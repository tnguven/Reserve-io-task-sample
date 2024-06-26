import { Router } from "express";
import { withAuthentication } from "../middleware/with-authentication";
import { userRouter } from "./user";
import { eventsRouter } from "./events";

export const router = Router();

router.use("/user", userRouter);
router.use("/events", withAuthentication, eventsRouter);
