const mongoose = require("mongoose");
const uuid = require("uuid");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SCERET_KEY, ACCESS_TOKEN_LIFE } = process.env;
const { adminType } = require("../enums");
const { schemaOption } = require("../utils/schemaOption")


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
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    accountType: {
        type: String,
        enum: Object.values(adminType),
        default: adminType.ADMIN
    },
    passwordReset: {
        token: { type: String },
        expireAt: { type: Date }
    },
    passwordUpdated: { type: Boolean, default: false },
    passwordUpdatedAt: { type: Date },
    lastLoggedInAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: String },
    updatedBy: { type: String }

}, schemaOption);


schema.methods.setHashedPassword = function () {
    var admin = this;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(admin.password, salt);
    admin.password = hashedPassword;
    admin.save();
}

schema.methods.compareHashedPassword = function (password) {
    try {
        const adminPassword = this.password;
        if (adminPassword) {
            const matchResult = bcrypt.compareSync(password, adminPassword);
            return matchResult;
        }
        else {
            return false;
        }

    } catch (err) {
        throw new Error("Error in matching hashed password")
    }


}

schema.methods.setJWT = function () {
    return jwt.sign( { _id: this.id  },
        ACCESS_TOKEN_SCERET_KEY,
        {
            expiresIn: ACCESS_TOKEN_LIFE
        }
    )
}

schema.methods.toJSON = function () {
    const admin = this;
    const adminObject = admin.toObject();
    delete adminObject.password;
    delete adminObject.__v;

    return adminObject;
};

const model = mongoose.model("admin", schema);
module.exports = model;