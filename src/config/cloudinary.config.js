//core

//third-party
import {v2 as cloudinary} from "cloudinary";

//custom

cloudinary.config({
    cloud_name: process.nextTick.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

export { cloudinary }