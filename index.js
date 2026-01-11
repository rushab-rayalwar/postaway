//core

//libs
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//local
import "./src/config/dotenv.config.js";
import server from "./server.js";
import { handleError } from "./src/middlewares/errorHandler.middleware.js";

import usersRouter from "./src/features/users/users.router.js";
import friendsRouter from "./src/features/friends/friends.router.js";
import postsRouter from "./src/features/posts/posts.router.js";
import commentsRouter from "./src/features/comments/comments.router.js";
import feedRouter from "./src/features/feed/feed.router.js";

//middlewares

server.use(cors({                   // NOTE this
    origin:[process.env.FRONTEND_URL, "http://localhost:3000"],
    credentials:true
}));
server.use(express.json());
server.use(express.urlencoded({extended:true}));
server.use(cookieParser());

//routes

server.use("/api/feed",feedRouter);
server.use("/api/users",usersRouter);
server.use("/api/friends",friendsRouter);
server.use("/api/posts",postsRouter);
server.use("/api/comments",commentsRouter);

// middlewares
server.use((req,res)=>{
    res.status(404).json({success:false, errors:["Invalid URL"]})
});
server.use(handleError);
