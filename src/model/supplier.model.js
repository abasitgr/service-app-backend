const mongoose = require("mongoose");
const uuid = require('uuid');
const { accountType, statusType, supplierVerification } = require("../enums");
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
        default: accountType.SUPPLIER
    },
    status: {
        type: String,
        enum: Object.values(statusType),
        default: statusType.APPLYING
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
        lastUpdatedAt: { type: Date },
    },
    lastActiveAt: { type: Date },
    isActive: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    verification: [{
        type: { type: String, enum: Object.values(supplierVerification) },
        detail: { type: String },
        file: {
            // bucket: { type: String },
            // key: { type: String },
            location: { type: String },
            lastUpdatedAt: { type: Date }
        }
    }],

    verified: [{
        verifiedBy: { type: String },
        verifiedAt: { type: Date, default: new Date() }
    }],
    approved: [{
        approvedBy: { type: String },
        approvedAt: { type: Date, default: new Date() }
    }],
    denied: [{
        deniedBy: { type: String },
        deniedAt: { type: Date, default: new Date() }
    }],
    witnessVerified: [{
        witnessVerifiedBy: { type: String },
        witnessVerifiedAt: { type: Date, default: new Date() }
    }],
    services: [{
        service: { type: String },
        assignedBy: { type: String },
        assignedAt: { type: Date }

    }],
    Witness:
        [{
            id: {
                type: String,
                default: () => {
                    return uuid.v4();
                },
            },
            firstName: {
                type: String,
                trim: true,
                lowercase: true,
            },
            lastName: {
                type: String,
                trim: true,
                lowercase: true,
            },
            email: {
                type: String,
                trim: true,
                lowercase: true,
            },
            phoneNumber: {
                type: String,
                trim: true,
                lowercase: true,
            },
            document: [{
                type: { type: String, enum: Object.values(supplierVerification) },
                detail: { type: String },
                file: {
                    // bucket: { type: String },
                    // key: { type: String },
                    location: { type: String },
                    lastUpdatedAt: { type: Date }
                },
                id: { type: String }
            }]
        }],


    isOnline: { type: Boolean, default: false },
    balance: {
        type: Number,
        default: 0
    },

    roomId:{
        type:String
    }



}, schemaOption)


schema.virtual("service", {
    ref: "service",
    localField: 'services.service',// "services.service",
    foreignField: "id"
});


schema.virtual("serviceCategory", {
    ref: "serviceCategory",
    localField: 'services.service', //"services.service",
    foreignField: "id"
});

schema.virtual("admin", {
    ref: "admin",
    localField: 'services.assignedBy', //"services.service",
    foreignField: "id"
});


schema.methods.imagePath = async function (path) {
    var user = this;
    user.profilePicture = path;
    console.log("path", path);
    await user.save();
};

schema.methods.image = async function (path, index, type) {
    var user = this;
    user[type][index].file = path;
    const result = await user.save();

};

schema.methods.witnessVerification = async function (path, id, type, data, index) {
    var user = this;
    user
    user[type][witness]['document'][index].file = path;
    await user.save();

};

schema.methods.setJWT = async function () {
    const user = this;
    const token = await jwt.sign({ _id: user.id }, ACCESS_TOKEN_SCERET_KEY, {
        expiresIn: ACCESS_TOKEN_LIFE,
    });
    return token;
};

const model = mongoose.model("Supplier", schema);
module.exports = model;




