const Supplier = require('../model/supplier.model');
const Appointment = require('../model/appointment.model');
const Notification = require('../model/notification.model');
const { ConfictError, InternalServerError, UnauthorizedError, NotFoundError } = require("../utils/error");
const { OKSuccess } = require("../utils/success");
const { Pagination } = require("../utils/pagination");
const config = require("../config/aws-config")
const S3 = require("../utils/awsS3");
const moment = require('moment-timezone');
const { userReponse, createPin, sendSMS } = require("../utils/helper")
const sharp = require('sharp');
const { statusType } = require("../enums");
const uuid = require('uuid');
const imageUpload = require("../utils/azureImageUpload");
const { notificationSent } = require("../utils/notification");

const AppointmentService = require("./appointment.service");



class SupplierService {
    supplierId;
    supplierDetail;
    constructor(id) {
        this.supplierId = id;
    }
    async getSupplierDetail(id) {
        try {
            let data = await Supplier.findOne({ id });
            if (!data) {
                throw new NotFoundError({ message: `Supplier not Found` });
            }
            return data;
        }
        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }
    }
    async getAll(data) {
        try {
            let skip = data.query.skip;
            var mysort = { createdAt: -1 };
            let perPage = data.query.page;
            let accountType =
                data.query.accountType == undefined || "" ? "" : data.query.accountType.trim();
            var _search =
                data.query.search == undefined || "" ? "" : data.query.search.trim();
            const suppliers = await Supplier.find({
                $or: [
                    {
                        email: { $regex: ".*" + _search + ".*" },
                        isDelete: false,

                    },
                    {
                        phoneNumber: { $regex: ".*" + _search + ".*" },
                        isDelete: false,

                    },

                ],
            })
                .sort(mysort)
                .limit(parseInt(parseInt(perPage)))
                .skip(parseInt(_search ? 0 : skip * parseInt(perPage)));
            if (suppliers.length >= 1) {

                const count = await Supplier.countDocuments({
                    $or: [
                        {
                            email: { $regex: ".*" + _search + ".*" },
                            isDelete: false,

                        },
                        {
                            phoneNumber: { $regex: ".*" + _search + ".*" },
                            isDelete: false,

                        },
                    ],
                });

                let pagination = await Pagination(count, perPage, skip)
                return { suppliers, pagination };
            } else {
                return { suppliers };
            }

        }
        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }
    }

    async addUser(body) {
        try {
            const { email, phoneNumber } = body;
            let supplier;
            supplier = await Supplier.findOne({
                email,
                isDelete: false,

            })

            if (supplier)
                throw new ConfictError({ message: `supplier already exsit this emaill: ${supplier.email}` });

            supplier = await Supplier.findOne({
                phoneNumber,
                isDelete: false,
            })
            if (supplier)
                throw new ConfictError({ message: `supplier already exsit this phone no: ${supplier.phoneNumber}` });
            console.log("body: ", body);
            let notificationBody = {
                type: "user-created",
                // content: `Supplier has been register to the HomePlug with this Email: ${body.email}`,
                content:{
                    title:"user-created",
                    message: `Supplier has been register to the HomePlug with this Email: ${body.email}`,
                    uniqueIdentity: body.email
                },
                createdAt: new Date()
            }
            console.log("notificationBody: ", notificationBody);
            let test = notificationSent(notificationBody)
            supplier = new Supplier(body);
            let notification = new Notification(notificationBody);
            const saveUser = await supplier.save();
            const notificatioSave = await notification.save();

            return saveUser
        } catch (err) {
            if (err.status === 409)
                return err;
            else
                throw new InternalServerError({ message: `supplier registration error`, data: err });
        }
    }


    async updateUser({ body, id, req }) {
        try {
            const data = await Supplier.findOne({ id: id, isDelete: false })
            if (!data) {
                throw new NotFoundError({ message: `Supplier is not available by this id: ${id}` });
            }
            const { email, phoneNumber } = body;
            let supplier;
            supplier = await Supplier.findOne({
                email,
                isDelete: false,
            })

            if (supplier && supplier.id !== id)
                throw new ConfictError({ message: `This email address: ${supplier.email} already exist another account.` });

            supplier = await Supplier.findOne({
                phoneNumber,
                isDelete: false,
            })
            if (supplier && supplier.id !== id)
                throw new ConfictError({ message: `This phone no: ${supplier.phoneNumber} already exist another account.` });
            supplier = await Supplier.findOneAndUpdate({ id }, { $set: body }, { new: true })

            if (req.file) {
                let fileName = supplier.id;
                let extension = '.png';
                let path = "supplier/profilePicture";
                const buffer = await sharp(req.file.buffer)
                    .png({ quality: 100, progressive: true })
                    .toBuffer();

                const location = await imageUpload.uploadFile(buffer, fileName, path, extension)
                let imageLocation = {
                    location: location,
                    lastUpdatedAt: new Date()
                }

                supplier.imagePath(imageLocation);
            }
            return supplier;
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else
                throw new InternalServerError({ message: 'error in editing', data: err })
        }
    }

    async generateOTP(supplier) {
        try {
            let momentTime = moment.tz("Asia/Karachi").format();
            var otp = await createPin()

            supplier.OTP = supplier.OTP.concat({
                code: otp,
                expireIn: 2,
                generatedAt: momentTime
            });

            let text = `Your verification code is: ${otp}`
           await sendSMS(text, supplier.phoneNumber)
            await supplier.save();
            return otp;
        }
        catch (err) {
            return err;
        }
    }
    async verifyOTP(supplier, otp) {
        console.log("tet", supplier.OTP[supplier.OTP.length - 1])
        try {
            const { generatedAt, expireIn, code } = supplier.OTP[supplier.OTP.length - 1];
            console.log("Verfied", generatedAt, expireIn, code)
            let generatedTime = moment(generatedAt).format();

            console.log("date from db: ", generatedTime);

            let minuteDifference = moment().diff(generatedTime, 'minutes');
            console.log("difference in minutes: ", minuteDifference);
            if (minuteDifference >= Number(expireIn)) {
                throw new UnauthorizedError({ message: "OTP has been expired" });
            }

            const isMatch = code == otp ? true : false
            if (!isMatch) {
                throw new UnauthorizedError({ message: "OTP has doesn`t match" });
            }
            supplier.OTP[supplier.OTP.length - 1].isValidate = true;
            supplier.OTP[supplier.OTP.length - 1].validatedAt = new Date();
            supplier.isOnline = true;
            await supplier.save();
            const token = await supplier.setJWT()
            const response = await userReponse(supplier)
            response.token = token;
            return response;

        }
        catch (err) {
            return err;
        }
    }



    async userDetail(req, value) {
        let id = value === "isOnline" ? req.user : req.params.id;
        const data = await Supplier.findOne({ id: id, isDelete: false })
        if (!data) {
            throw new NotFoundError({ message: `Supplier is not available by this id: ${id}` });
        }
        data[value] = !data[value]
        await data.save();
        return data;
    }

    async supplierPDF() {
        try {
            const result = await this.getSupplier();
            //  console.log('validate result', result);
            if (!result) {
                throw new Error.NotFoundError(`Supplier id not exist ${this.supplierId}`);
            } else {
                const supplier = new SupplierService(this.supplierId);
                supplier.supplierDetail = result;
                return supplier;
            }
        } catch (err) {
            console.log("(err)", err)

        }
    }

    async getSupplier() {
        console.log("checking supplier data exist", this.supplierId);
        try {
            const data = await Supplier.findOne({
                id: this.supplierId,
                isDelete: false

            }).populate("service", "name isActive").populate("serviceCategory", "serviceName isActive").populate("admin", "name email phoneNumber isActive accountType")
            //      console.log("get supplier ", data);


            return data;
        }
        catch (err) {
            console.log("get supplier error: ", err);
            throw new Error(err);
        }
    }

    async verifySupplier({ body, id, req }) {
        // console.log("File: ",req.files)

        try {
            let dataValue = await Supplier.findOne({ id: id, isDelete: false })
            if (!dataValue) {
                throw new NotFoundError({ message: `Supplier is not available by this id: ${id}` });
            }
            let exist = await Supplier.findOne({ 'verification.detail': body.verification[0].detail, id: { $ne: id } })
            // console.log("exist", exist)

            if (dataValue.status === statusType.APPLYING) {
                if (exist) {
                    throw new ConfictError({ message: `Supplier already exist by this CNIC: ${body.verification[0].detail}` })
                }

                if (req.files) {

                    dataValue.verification = body.verification;
                    await dataValue.save()
                    for (let i = 0; i < dataValue.verification.length; i++) {

                        let fileName = dataValue.id + new Date();
                        let extension = ".png";
                        let path = "supplier/personalInformation/" + dataValue.verification[i].type;
                        const location = await imageUpload.uploadFile(req.files[dataValue.verification[i].type][0].buffer, fileName, path, extension)
                        let imageLocation = {
                            location: location,
                            lastUpdatedAt: new Date()
                        }

                        // const location = await S3.uploadFile(
                        //     req.files[dataValue.verification[i].type][0].buffer,
                        //     `${dataValue.verification[i].type}_${id}.${extension}`,
                        //     `${config.S3.UserFolder}/${id}/${dataValue.verification[i].type}`
                        // );
                        console.log("Location: ", location);
                        // new Promise((rej, res) =>{
                        //     let insertInDB
                        // }) 
                        await dataValue.image(imageLocation, i, "verification");
                    }


                    return dataValue
                }
            } else {
                throw new ConfictError({ message: `Some thing wrong for supplier status` });
            }
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else {
                console.log("errr", err)
                throw new InternalServerError({ message: 'error in editing', data: err })
            }


        }
    }




    async supplierWitness({ body, id, req }) {

        try {
            const { firstName, lastName, email, phoneNumber } = body;

            let dataValue = await Supplier.findOne({ id: id, isDelete: false })
            if (!dataValue) {
                throw new NotFoundError({ message: `Supplier is not available by this id: ${id}` });
            }
            if (dataValue.verification[0].detail === body.document[0].detail || dataValue.phoneNumber === body.phoneNumber || dataValue.email === body.email) {
                console.log("ddd: ", body.email)
                console.log("val: ", dataValue.email)
                throw new ConfictError({ message: `Supplier and Witness cannot be same` });
            }
            if (dataValue.Witness.length < 2) {
                if (dataValue.status === statusType.VERIFIED) {
                    if (req.files) {
                        if (body.document.length > 0) {
                            if (dataValue.Witness.findIndex(data => data.document[0].detail === body.document[0].detail) === -1 && dataValue.Witness.findIndex(data => data.email === body.email) === -1 && dataValue.Witness.findIndex(data => data.phoneNumber === body.phoneNumber) === -1) {
                                let promises = body.document.map(async (document, i) => {
                                    if (document.type in req.files) {
                                        let witnessDocumentId = uuid.v4();

                                        // let fileName = uuid.v4();
                                        let fileName = witnessDocumentId;
                                        let extension = ".png";
                                        let path = "supplier/WitnessDetails/" + document.type;
                                        const location = await imageUpload.uploadFile(req.files[document.type][0].buffer, fileName, path, extension)
                                        let imageLocation = {
                                            location: location,
                                            lastUpdatedAt: new Date()
                                        }

                                        // let witnessDocumentId = uuid.v4();
                                        // const location = await S3.uploadFile(
                                        //     req.files[document.type][0].buffer,
                                        //     `${document.type}_${witnessDocumentId}.${extension}`,
                                        //     `${config.S3.UserFolder}/${id}/${document.type}`
                                        // );
                                        // console.log("req.user", location);
                                        return { file: imageLocation, type: document.type, detail: document.detail, id: witnessDocumentId };
                                    }
                                })

                                const documents = await Promise.all(promises);
                                console.log("Doc:", documents)
                                dataValue.Witness.push({
                                    'firstName': firstName,
                                    'lastName': lastName,
                                    'email': email,
                                    'phoneNumber': phoneNumber,
                                    'document': documents
                                })
                                return await dataValue.save();

                            } else throw new ConfictError({ message: `Something wrong please check CNIC || Email || Phone number already exist` });
                        }


                    }
                } else
                    throw new ConfictError({ message: `Supplier need to verified first` });

            } else
                throw new ConfictError({ message: `Witness limit exceed` });
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else {
                console.log("errr", err)
                throw new InternalServerError({ message: 'error in editing', data: err })
            }


        }
    }


    async supplierService({ body, id, req }) {

        try {
            let dataValue = await Supplier.findOne({ id: id, isDelete: false })
            if (!dataValue) {
                throw new NotFoundError({ message: `Supplier is not available by this id: ${id}` });
            }
            console.log("dataVal:", dataValue);

            if ((dataValue.status === statusType.WITNESS_VERIFIED || dataValue.status === statusType.APPROVED)) {

                body.map(data => {
                    data.assignedBy = req.user;
                    data.assignedAt = new Date()
                })
                let newArray = dataValue.services.concat(body);
                let uniqueItem = Object.values(newArray.reduce((acc, cur) => Object.assign(acc, { [cur.service]: cur }), {}))
                dataValue.services = uniqueItem

                await dataValue.save()



                return dataValue

            } else
                throw new ConfictError({ message: `Something wrong account status is ${dataValue.status}` });
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else {
                console.log("errr", err)
                throw new InternalServerError({ message: 'error in editing', data: err })
            }


        }
    }

    async removeSupplierService({ body, id, serviceID, req }) {

        try {
            let dataValue = await Supplier.findOne({ id: id, isDelete: false, "services.service": serviceID })

            if (!dataValue) {
                throw new NotFoundError({ message: `Supplier service is not available by this id: ${serviceID}` });
            }

            if (dataValue.services.length > 0 && (dataValue.status === statusType.WITNESS_VERIFIED || dataValue.status === statusType.APPROVED)) {
                var filtered = dataValue.services.filter(function (el) { return el.service != serviceID; });
                console.log("dataValue", filtered)

                dataValue.services = filtered

                await dataValue.save()



                return dataValue

            } else
                throw new ConfictError({ message: `Something wrong account status is ${dataValue.status}` });
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else {
                console.log("errr", err)
                throw new InternalServerError({ message: 'error in editing', data: err })
            }


        }
    }

    async removeSupplierwitness({ body, id, witnessID, req }) {

        try {
            let dataValue = await Supplier.findOne({ id: id, isDelete: false, "Witness.id": witnessID })

            if (!dataValue) {
                throw new NotFoundError({ message: `Supplier witness is not available by this id: ${witnessID}` });
            }

            if (dataValue.Witness.length > 0 && dataValue.status === statusType.VERIFIED) {
                var filtered = dataValue.Witness.filter(function (el) { return el.id != witnessID; });
                console.log("dataValue", filtered)

                dataValue.Witness = filtered

                await dataValue.save()



                return dataValue

            } else
                throw new ConfictError({ message: `Something wrong account status is ${dataValue.status}` });
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else {
                console.log("errr", err)
                throw new InternalServerError({ message: 'error in editing', data: err })
            }


        }
    }

    async verification({ body, id, req }) {
        // console.log("req.user", req)
        try {
            let dataValue = await Supplier.findOne({ id: id, isDelete: false })
            if (!dataValue) {
                throw new NotFoundError({ message: `Supplier is not available by this id: ${id}` });
            }
            if (body.status === statusType.VERIFIED) {

                dataValue.status = statusType.VERIFIED;
                dataValue.verified = dataValue.verified.concat({
                    verifiedBy: req.user
                })
                await dataValue.save()
            } else if (body.status === statusType.WITNESS_VERIFIED) {
                dataValue.status = statusType.WITNESS_VERIFIED;
                dataValue.witnessVerified = dataValue.witnessVerified.concat({ witnessVerifiedBy: req.user })
                await dataValue.save()
            } else if (body.status === statusType.APPROVED) {
                dataValue.status = statusType.APPROVED;
                dataValue.isActive = true;
                dataValue.approved = dataValue.approved.concat({ approvedBy: req.user })
                await dataValue.save()
            }
            else if (body.status === statusType.DENIED) {
                // console.log("559")
                // let appt = await Appointment.findOne({ user: id, isDelete: false});
                // appt.status = "failed";
                dataValue.status = statusType.DENIED;
                dataValue.isActive = false;
                dataValue.verification = [];
                dataValue.Witness = [];
                dataValue.services = [];
                dataValue.verified = {};
                dataValue.denied = dataValue.denied.concat({ deniedBy: req.user })
                await dataValue.save()
            }
            else if (body.status === statusType.APPLYING) {
                dataValue.status = statusType.APPLYING;
                dataValue.isActive = false;
                await dataValue.save()
            }
            else {
                throw new NotFoundError({ message: `Invalid supplier status` });
            }



            return dataValue

        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else {
                console.log("errr", err)
                throw new InternalServerError({ message: 'error in editing', data: err })
            }


        }
    }

    // async supplierAppointment({ id, body }) {

    //     try {
    //         let supplier = await Supplier.findOne({ id, isDelete: false })
    //         if (!supplier) {
    //             throw new NotFoundError({ message: `Supplier not found by this id: ${serviceID}` });
    //         }
    //         return supplier;
    //     }
    //     catch (err) {
    //         if (err.status === 404 || err.status === 409)
    //             return err;
    //         else {
    //             throw new InternalServerError({ message: 'Internal Server Error', data: err })
    //         }
    //     }
    // }
}


module.exports = SupplierService;
