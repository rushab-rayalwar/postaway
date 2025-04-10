import mongoose from "mongoose";
import validator from "validator";

const usersSchema = new mongoose.Schema({
    name:{type:String, required:[true, "Name is required"]},
    email:{
        type:String,
        required:[true, "Email is required"],
        validate:[validator.isEmail, "Email is invalid"], // NOTE
        unique: true
    },
    password:{type:String, required:[true, "Password is required"], minLength:[5, "Password must be at least 5 characters long"]},
    tokenVersion : {
        type: Number,
        default: 0
    }
},{ collection : "users", timeStamps : true });

const UserModel = mongoose.model("User",usersSchema);

export { usersSchema, UserModel };