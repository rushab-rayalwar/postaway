// core

// third-party
import multer from "multer";
import streamifier from "streamifier";

// custom
import { cloudinary } from "../config/cloudinary.config";
 
export default function uploadToCloudinary(req,res,next){
    return new Promise(
        (resolve, reject)=>{
            const buffer = req.file.buffer;
            const stream = cloudinary.uploader.upload_stream(
                { folder: "postaway/postImages" },
                (error, result)=>{

                }
            );
        }
    )
}
