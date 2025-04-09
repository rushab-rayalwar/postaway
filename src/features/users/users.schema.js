import mongoose from "mongoose";
import validator from "validator";

const usersSchema = new mongoose.Schema({
    name:{type:String, required:[true, "Name is required"]},
    email:{
        type:String,
        required:[true, "Email is required"],
        validate:[validator.isEmail, "Email is invalid"], // NOTE
        unique: [true, "User Already Exists"]
    },
    password:{type:String, required:[true, "Password is required"], minLength:[5, "Password must be at least 5 characters long"]},
    tokenVersion : {
        type: Number,
        default: 0
    }
});

const UserModel = mongoose.model("User",usersSchema);

export { usersSchema, UserModel };