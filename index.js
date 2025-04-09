//core

//third-party
import express from "express";

//custom
import "./src/config/dotenv.config.js";
import server from "./server.js";
import usersRouter from "./src/features/users/users.router.js";
import { handleError } from "./src/middlewares/errorhandler.middleware.js";
import cookieParser from "cookie-parser";
import jwtAuthenticator from "./src/middlewares/jwtAuthenticator.js";

//middlewares
server.use(express.json());
server.use(express.urlencoded({extended:true}));
server.use(cookieParser());

//routes
server.use("/api/users",usersRouter);

// middlewares
server.use(handleError);