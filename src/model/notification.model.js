const mongoose = require("mongoose");
const uuid = require("uuid");
const { schemaOption } = require("../utils/schemaOption")
const { notificationType } = require("../enums")

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
        enum: Object.values(notificationType),
    },
    sentTo: { type: Array },
    content: {
        title: { type: String },
        message: { type: String },
        uniqueIdentity: { type: String }
    },
    isRead: { type: Boolean, default: false },
    readBy: [
        {
            readerId: { type: String, required: true },
            readAt: { type: Date, default: new Date() }
        }
    ],
    createdAt: { type: Date, },
}, schemaOption);



const model = mongoose.model("Notification", schema);
module.exports = model;