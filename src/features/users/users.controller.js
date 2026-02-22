//core

// third-party
import express from "express";
import UsersRepository from "./users.repository.js";
import jwt from "jsonwebtoken";

//custom


export default class UsersController { 
    constructor(){
        this.repository = new UsersRepository();
    }

    async updateProfilePicture(req,res){
        let url = req.image.public_id;
        let userId = req.user.userId;
        let response = await this.repository.updateProfilePicture(userId, url);
        if(response.success){
            return res.status(response.statusCode).json({success:true, data:response.data, message:response.message});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors});
        }
    }

    async getUsers(req,res,next){
        let searchQuery = req.query.search;
        let page = req.query.page;
        let limit = req.query.limit;
        let response = await this.repository.getUsers(searchQuery, page, limit);
        if(response.success){
            return res.status(response.statusCode).json({success:true, data:response.data, message:response.message});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors});
        }
    }

    async auth(req,res,next){
        let userId = req.user.userId;
        let response = await this.repository.getuserDetails(userId);
        if(response.success){ 
            return res.status(response.statusCode).json({success:true, data:response.data, message:response.message});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors});
        }
    }

    async signUp(req,res,next){
        let userData = req.body; // the request body contains the attributes name, email and password
        let response = await this.repository.signUp(userData);
        if(response.success){
            return res.status(response.statusCode).json({success:true, data:response.data, message:response.message});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors});
        }
    }
    
    async signIn(req,res,next){
        let userData = req.body;
        if( !userData || !userData.email || !userData.password){ // NOTE the order of the checks, it is important to check for userData first
            return res.status(400).json({success:false, errors:["Email and password are required."]});
        }
        let response = await this.repository.signIn(userData);
        if(response.success){
            let user = response.data;
            let userTokenVersion = user.tokenVersion;
            let token = jwt.sign(
                {
                    userId:user._id,
                    userName:user.name,
                    email:user.email,
                    tokenVersion : userTokenVersion
                }, 
                process.env.JWT_SECRET, 
                {expiresIn:"24h"});
            return res.cookie("jwt", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 24 * 60 * 60 * 1000,
              }).status(response.statusCode).json({success:true, data:response.data, message:response.message, token:token});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors});
        }
    }

    async logout(req,res,next){
        res.clearCookie("jwt");
        return res.status(200).json({success:true, message:"User logged out successfully.", data:null});
    }
    
    async logoutAllDevices(req,res,next){
        let userId = req.user.userId;
        let response = await this.repository.logoutAllDevices(userId);
        if(response.success){
            res.clearCookie("jwt");
            return res.status(200).json({success:true, message:response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors});
        }
    }
}