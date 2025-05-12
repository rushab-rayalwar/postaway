// libs
import express from "express";

// custom
import BookmarksController from "./bookmarks.controller.js";

const bookmarksRouter = express.Router();
const bookmarksController = new BookmarksController();

bookmarksRouter.post("/:postId", (req,res,next)=>bookmarksController(req,res,next) );

export default bookmarksRouter;