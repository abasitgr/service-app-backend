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
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    description: {
        type: String,
    },
    category: {
        type: String,
        required: true
    },
    image: {
        // bucket: { type: String },
        // key: { type: String },
        location: { type: String },
        lastUpdatedAt: { type: Date },

    },
    baseCharges: {
        type: Number,
        default: 0
    },
    chargesType: {
        type: String,
        enum: Object.values(chargesType),
    },
    bookingType:{
        type: String,
        enum: Object.values(bookingType),
    },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: String },
    updatedBy: { type: String }

}, schemaOption);



schema.virtual("services", {
    ref: "serviceCategory",
    localField: "category",
    foreignField: "id",
    justOne: true
});

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

schema.methods.imagePath = async function (path) {
    let services = this;
    services.image = path;
    await services.save();
};


const model = mongoose.model("service", schema);
module.exports = model;