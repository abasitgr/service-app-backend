const mongoose = require("mongoose");
const uuid = require("uuid");
const { schemaOption } = require("../utils/schemaOption")
const {chargesType,bookingType} = require("../enums")


const schema = new mongoose.Schema({
    id: {
        type: String,
        default: () => {
            return uuid.v4();
        },
        required: true,
        index: true
    },
    serviceName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    description: {
        type: String,
    },
    image: {
        // bucket: { type: String },
        // key: { type: String },
        location: { type: String },
        lastUpdatedAt: { type: Date },
        // url: { type: String }
    },
    baseCharges: {
        type: Number,
        default: 0
    },
    chargesType: {
        type: String,
        enum: Object.values(chargesType),
        default:chargesType.FIXED
    },
    bookingType:{
        type: String,
        enum: Object.values(bookingType),
        default:bookingType.ADVANCE
    },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: String },
    updatedBy: { type: String }

}, schemaOption);

schema.virtual("adminCreate", {
    ref: "admin",
    localField: "createdBy",
    foreignField: "id",
    justOne: true
});

schema.virtual("adminUpdate", {
    ref: "admin",
    localField: "updatedBy",
    foreignField: "id",
    justOne: true
});

schema.virtual("serviceCategory", {
    ref: "service",
    localField: "id",
    foreignField: "category"
});
schema.methods.imagePath = async function (path) {
    var services = this;
    services.image = path;
    console.log("path", path);
    await services.save();
};

const model = mongoose.model("serviceCategory", schema);
module.exports = model;