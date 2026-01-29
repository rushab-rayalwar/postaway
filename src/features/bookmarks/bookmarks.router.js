// libs
import express from "express";

// custom
import BookmarksController from "./bookmarks.controller.js";
import jwtAuthenticator from "../../middlewares/jwtAuthenticator.js";

const bookmarksRouter = express.Router();
const bookmarksController = new BookmarksController();

//GET
bookmarksRouter.get("/", jwtAuthenticator, (req,res,next)=>bookmarksController.getBookmarks(req,res,next));

//POST
bookmarksRouter.post("/:postId", jwtAuthenticator, (req,res,next)=>bookmarksController.addBookmark(req,res,next) );

export default bookmarksRouter;