// core

// libs
import express from 'express';

// custom
import LikesController from './likes.controller.js';
import jwtAuthenticator from '../../middlewares/jwtAuthenticator.js';

const likesRouter = express.Router();
const likesController = new LikesController();

//GET
likesRouter.get("/:postId", jwtAuthenticator, (req,res,next)=>likesController.getLikesForAPost(req,res,next));

//PATCH
likesRouter.patch("/:postId", jwtAuthenticator, (req,res,next)=>likesController.toggleLike(req,res,next));

export default likesRouter;