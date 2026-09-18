import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    emailVerified:{
        type:Boolean,
        default:false
    },
    passwordHash:{
        type:String,
        select:false
    },
    resetPasswordTokenHash:{
        type:String,
        select:false
    },
    resetPasswordExpiresAt:{
        type:Date,
        select:false
    },
    verificationOtpHash:{
        type:String,
        select:false
    },
    verificationOtpExpiresAt:{
        type:Date,
        select:false
    },
    credits:{
        type:Number,
        default:499
    }

}, {timestamps:true})

const User = mongoose.model("User" , userSchema)

export default User