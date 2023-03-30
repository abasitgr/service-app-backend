const mongoose = require("mongoose");
const uuid = require("uuid");
const { schemaOption } = require("../utils/schemaOption")
const {chatStatus} = require("../enums")


const schema = new mongoose.Schema({
    id: {
        type: String,
        default: () => {
            return uuid.v4();
        },
        required: true,
        index: true
    },

    roomId : {
        type: String,
        default: () => {
            return uuid.v4();
        },
        required: true,
        index: true
    },

    jobId:{
        type:String,
        required:true
    },

    user : [{
        accountType : {
            type: String
        },
        userId : {type: String}
    }],

    messages : [{
        from : {type:String},
        message: {type:String},
        time : {type:Date},
        seen : {type:Boolean,default:false}
    }],

    status:{
        type:String,
        enum: Object.values(chatStatus)
    }
}, schemaOption);


const model = mongoose.model("chat", schema);
module.exports = model;