const mongoose = require("mongoose");
const uuid = require("uuid");
const { schemaOption } = require("../utils/schemaOption")
const { paymentType } = require("../enums")

const schema = new mongoose.Schema({
    id: {
        type: String,
        default: () => {
            return uuid.v4();
        },
        required: true,
        index: true
    },
    jobId: { type: String },
    amount: { type: Number },
    paymentType: {
        type: String,
        enum: Object.values(paymentType),
        default: paymentType.CASH
    }


}, schemaOption);



const model = mongoose.model("payment", schema);
module.exports = model;