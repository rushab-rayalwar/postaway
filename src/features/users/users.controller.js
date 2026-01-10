//core

// third-party
import express from "express";
import UsersRepository from "./users.repository.js";
import jwt from "jsonwebtoken";

//custom


export default class UsersController {
    constructor(){
        this.usersRepository = new UsersRepository();
    }
    async signUp(req,res,next){
        let userData = req.body; // the request body contains the attributes name, email and password
        let response = await this.usersRepository.signUp(userData);
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
        let response = await this.usersRepository.signIn(userData);
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
            return res.cookie("jwt", token, { // NOTE this:
                httpOnly: true,                     // prevents JS access (more secure)
                secure: process.env.NODE_ENV === "production", // HTTPS only in production
                sameSite: "none",                    // "none" is for development, "lax" for production
                maxAge: 24 * 60 * 60 * 1000,
              }).status(response.statusCode).json({success:true, data:response.data, message:response.message, token:token});
        } else {
            return res.status(response.statusCode).json({success:false, errors:[response.errors]});
        }
    }

    async logout(req,res,next){
        res.clearCookie("jwt");
        return res.status(200).json({success:true, message:"User logged out successfully.", data:null});
    }
    
    async logoutAllDevices(req,res,next){
        let userId = req.user.userId;
        let response = await this.usersRepository.logoutAllDevices(userId);
        if(response.success){
            res.clearCookie("jwt");
            return res.status(200).json({success:true, message:response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success:false, errors:[response.errors]});
        }
    }
}