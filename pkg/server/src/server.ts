import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";

import { router } from "./routes";

export const server = express();

server.use(cors());
server.use(helmet());
server.use(cookieParser());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(compression());

server.use("/v1", router);
