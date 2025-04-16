//core

//third-party
import express from "express";

//custom
import "./src/config/dotenv.config.js";
import server from "./server.js";
import { handleError } from "./src/middlewares/errorhandler.middleware.js";
import cookieParser from "cookie-parser";

import usersRouter from "./src/features/users/users.router.js";
import friendsRouter from "./src/features/friends/friends.router.js";
import postsRouter from "./src/features/posts/posts.router.js";

//middlewares
server.use(express.json());
server.use(express.urlencoded({extended:true}));
server.use(cookieParser());

//routes
server.use("/api/users",usersRouter);
server.use("/api/friends",friendsRouter);
server.use("/api/posts",postsRouter);

// middlewares
server.use(handleError);