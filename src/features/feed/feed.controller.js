// core

// libs
import express from "express";
import mongoose from "mongoose";

// custom
import FeedRepository from "./feed.repository.js";

export default class FeedController{
    constructor(){
        this.feedRepository = new FeedRepository();
    }

    async getPosts(req, res, next){
        let userId = req.user.userId;
        let { cursor, filter } = req.query; // cursor is an ObjectId for a post
        let limit = Math.min(parseInt(req.query.limit) || 3, 10); // default 3, max 10

        let response = await this.feedRepository.getFeed(userId, limit, cursor, filter);
        if(!response.success) {
            return res.status(response.statusCode).json({success: false, errors:response.errors});
        } else {
            return res.status(200).json({success: true, data: response.data, message: response.message});
        }
    }
}