const mongoose = require("mongoose");
const uuid = require("uuid");
const { schemaOption } = require("../utils/schemaOption")
const { verificationStatus, jobStatus, bookingType, chargesType, serviceStatus } = require("../enums")

const schema = new mongoose.Schema({
    id: {
        type: String,
        default: () => {
            return uuid.v4();
        },
        required: true,
        index: true
    },
    user: {
        userId: { type: String },
        location: {
            lat: { type: mongoose.Types.Decimal128 },
            long: { type: mongoose.Types.Decimal128 }
        },
        formattedAddress: { type: String }
    },
    supplier: {
        supplierId: { type: String },
        acceptedTime: { type: Date }
    },

    verificationCode: {
        code: { type: String },
        isValidate: { type: Boolean, default: false },
        time: { type: Date }
    },

    status: {
        type: String,
        enum: Object.values(jobStatus),
        default: jobStatus.REQUEST
    },

    bookingTime: { type: Date },

    charges: {
        baseCharge: { type: Number },
        equipmentCharge: { type: Number },
        totalCharge: { type: Number },
        serviceCharge: [{
            id: { type: String },
            amount: { type: Number },
            bookingType: {
                type: String,
                enum: Object.values(bookingType),
            },
            chargesType: {
                type: String,
                enum: Object.values(chargesType),
            },
            status: {
                type: String,
                enum: Object.values(serviceStatus),
            },
            time: [{
                startTime: { type: Date },
                endTime: { type: Date },
            }]
        }]
    },

    supplierFeedback: {
        id: {
            type: String,
            default: () => {
                return uuid.v4();
            },
            required: true,
            index: true
        },
        review: {
            type: String,
            lowercase: true,
            trim: true
        },
        rating: {
            type: Number,
        },
        time: { type: Date },
        isDelete: { type: Boolean, default: false },
    },

    userFeedback: {
        id: {
            type: String,
            default: () => {
                return uuid.v4();
            },
            required: true,
            index: true
        },
        review: {
            type: String,
            lowercase: true,
            trim: true
        },
        rating: {
            type: Number,
        },
        time: { type: Date },
        isDelete: { type: Boolean, default: false },
    },


}, schemaOption);

schema.virtual("users", {
    ref: "User",
    localField: 'user.userId',
    foreignField: "id"
});

schema.virtual("suppliers", {
    ref: "Supplier",
    localField: 'supplier.supplierId',
    foreignField: "id"
});

schema.virtual("services", {
    ref: "service",
    localField: 'charges.serviceCharge.id',
    foreignField: "id"
});

schema.virtual("charges.serviceCharge.service", {
    ref: "service",
    localField: 'charges.serviceCharge.id',
    foreignField: "id"
});

schema.virtual("charges.serviceCharge.category", {
    ref: "serviceCategory",
    localField: 'charges.serviceCharge.id',
    foreignField: "id"
});

schema.virtual("user.name", {
    ref: "User",
    localField: 'user.userId',
    foreignField: "id",
    justOne: true,
});


const model = mongoose.model("job", schema);
module.exports = model;