const ServiceCategory = require("../model/servicesCategory.model");
const Services = require("../model/services.model");
const multer = require("multer");
const twilio = require('twilio');
const AWS = require('aws-sdk');
const moment = require('moment')

const getServiceCategory = async (key, value) => {
    const found = await ServiceCategory.findOne({ [key]: value, isDelete: false }).populate("serviceCategory", "name isActive description image category id baseCharges chargesType bookingType").sort({ name: 1 });
    return found;
}

const service = async (key, value) => {
    const data = await Services.find({ [key]: value, isDelete: false }).populate("service", "serviceName baseCharges");
    return data;
}


const fileUploader = multer({
    limits: {
        fieldSize: 5000000
    },
    fileFilter(req, file, cb) {
        let regex = file.fieldname === "profilePicture" ? /\.(png|PNG|jpg|JPG|jpeg|JPEG)$/ : /\.(png|PNG)$/;
        if (!file.originalname.match(regex)) {
            return cb(new Error("Please uplaod valid File"));
        }
        cb(undefined, true);
    }
});



const joiResponse = (result, res, next) => {
    if (!result.error) {
        next();
    } else {
        const errorArr = [];
        for (i in result.error.details) {
            let makeKey = `${result.error.details[i].path}`;
            var obj = {};
            obj[makeKey] = result.error.details[i].message
            errorArr.push(obj);
        }
        //return res.status(500).json(new InternalServerError({ message: errorArr }));
        return res.status(500).json(errorArr);
    }
}


const userReponse = (data) => {
    const userObject = data.toObject();
    delete userObject.__v;
    delete userObject.OTP;
    delete userObject.isActive;
    delete userObject.isDelete;
    return userObject
}


const createPin = () => {

    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

const sendSMS = async (text, phone) => {
    try {
        var client = new twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
        const message = await client.messages.create({
            body: text,
            to: `${phone}`,  // Text this number
            from: `${process.env.PHONE_NO}` // From a valid Twilio number
        });
        if (message) {
            // console.log('Sms response', message);
            return `SMS sent successfully to ${phone}`
        }
    } catch (err) {
        console.log("err", err)
        throw new Error.InternalServerError(err);
    }
}

const convertImage = async (image) => {
    if (image.key && image.bucket) {
        let keyId = image.key;

        const s3 = new AWS.S3({
            region: 'ca-central-1',
            credentials: {
                accessKeyId: 'AKIAZGORRFKCIRJ7W3PV',
                secretAccessKey: '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',
            },
        });
        const params = {
            Bucket: image.bucket,
            Key: keyId,
        };

        const url = s3.getSignedUrl('getObject', params);
        return url;
    }
    return ""
};

const getServices = async (record, supplierDetail) => {
    let name = "";
    let serviceRecord = supplierDetail.service.find(service => service.id === record.service);
    if (serviceRecord) {
        let service = await Services.findOne({ id: serviceRecord.id })
        let categoryName = await ServiceCategory.findOne({ id: service.category })
        name = (serviceRecord ? serviceRecord.name : categoryRecord ? categoryRecord.serviceName : "") + (categoryName ? (" - " + categoryName.serviceName) : "")
    }
    let categoryRecord = supplierDetail.serviceCategory.find(service => service.id === record.service);
    return serviceRecord ? name : categoryRecord ? categoryRecord.serviceName : ""
}

const getAdmin = (data, supplierDetail) => {
    let record = supplierDetail.admin ? supplierDetail.admin.find((user) => {
        return user.id === data.assignedBy
    }) : ""
    return record && record.email ? record.email : ""
}
const DateConverter = (record) => {
    let date = moment(record).format("DD/MM/YYYY")
    return date;
}
module.exports = { getServiceCategory, service, fileUploader, joiResponse, userReponse, createPin, sendSMS, convertImage, getServices, getAdmin, DateConverter }