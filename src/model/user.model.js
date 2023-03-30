const mongoose = require("mongoose");
const uuid = require('uuid');
const { accountType } = require("../enums");
const { schemaOption } = require("../utils/schemaOption")
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SCERET_KEY, ACCESS_TOKEN_LIFE } = process.env;

const schema = new mongoose.Schema({
    id: {
        type: String,
        default: () => {
            return uuid.v4();
        },
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },

    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    accountType: {
        type: String,
        enum: Object.values(accountType),
        default: accountType.CONSUMER
    },
    OTP: [{
        code: { type: String },
        expireIn: { type: String },
        generatedAt: { type: Date },
        isValidate: { type: Boolean, default: false },
        validatedAt: { type: Date }


    }],
    fcmToken: {
        type: Array
    },
    profilePicture: {
        location: { type: String },
        lastUpdatedAt: { type: Date }
    },
    lastActiveAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    balance:{
        type:Number,
        default : 0
    },

    roomId:{
        type:String
    }




    //isOffline: { type: Boolean, default: true },
}, schemaOption)


schema.methods.imagePath = async function (path) {
    var user = this;
    user.profilePicture = path;
    console.log("path", path);
    await user.save();
};

schema.methods.setJWT = async function () {
    const user = this;
    const token = await jwt.sign({ _id: user.id }, ACCESS_TOKEN_SCERET_KEY, {
        expiresIn: ACCESS_TOKEN_LIFE,
    });
    return token;
};

const model = mongoose.model("User", schema);
module.exports = model;




