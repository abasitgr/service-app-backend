const mongoose = require("mongoose");
const uuid = require('uuid');
const { schemaOption } = require("../utils/schemaOption")
const appointmentType = require("../enums/appointment")

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
        type: String,
        required: true
    },

    appointmentStartTime: {
        type: Date,
    },
    
    appointmentEndTime: {
        type: Date,
    },

    status: {
        type: String,
        enum: Object.values(appointmentType),
        default: appointmentType.BOOKED
    },

    appointed: [{
        assignedBy: { type: String },
        assignedAt: { type: Date, default: new Date() }
    }],

    isDelete: { type: Boolean, default: false },


}, schemaOption)

schema.virtual("admin", {
    ref: "admin",
    localField: 'appointed.assignedBy', 
    foreignField: "id"
});


const model = mongoose.model("Appointment", schema);
module.exports = model;




