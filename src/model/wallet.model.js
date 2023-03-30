const mongoose = require("mongoose");
const uuid = require("uuid");
const { schemaOption } = require("../utils/schemaOption")
const { walletType, accountType, paymentStatus, walletMainType } = require("../enums")


const schema = new mongoose.Schema({
    id: {
        type: String,
        default: () => {
            return uuid.v4();
        },
        required: true,
        index: true
    },

    type: {
        type: String,
        enum: Object.values(walletMainType)
        // opening balance, weekly trnasaction, job
    },

    jobId: {
        type: String
    },

    transaction: [
        {
            type: {
                type: String,
                enum: Object.values(walletType)
                //received (for admin id), pending (weekly), deposit(opening balance) 
            },
            amount: { type: Number },
            time: { type: Date },
            accountType: {
                type: String,
                enum: Object.values(accountType)
            },
            id: { type: String }
        }
    ],
    amount: {
        type: Number
    },
    status: {
        type: String,
        enum: Object.values(paymentStatus)
    }
}, schemaOption);


const model = mongoose.model("wallet", schema);
module.exports = model;