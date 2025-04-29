// core

// libs
import express from 'express';

// custom
import LikesController from './likes.controller';

const likesRouter = express.Router();
const likesController = new LikesController();

//GET
likesRouter.get("/:postId", jwtAuthenticator, (req,req,next)=>likesController.getLikesForAPost(req,res,next));

//PATCH
likesRouter.patch("/:postId", jwtAuthenticator, (req,res,next)=>likesController.toggleLike(req,res,next));