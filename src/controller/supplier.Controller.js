const SupplierService = require("../service/supplier.service");
const Supplier = require("../model/supplier.model");
const { OKSuccess } = require("../utils/success");
const { NotFoundError, InternalServerError, UnauthorizedError } = require("../utils/error");
const PDFService = require("../service/pdf.service");
const fs = require('fs');
const { convertImage } = require("../utils/helper");

// testing
// const { BlobServiceClient } = require('@azure/storage-blob');
const ImageService = require("../service/image.service");
const multer = require('multer')
const inMemoryStorage = multer.memoryStorage();
const singleFileUpload = multer({ storage: inMemoryStorage });
const azureStorage = require('azure-storage');
const { uploadFile } = require("../utils/awsS3");
const EmailService = require("../service/email.service");

const UserService = require("../service/user.service");
const JobService = require('../service/job.service')

module.exports.Registration = async (req, res) => {
    try {
        const { body } = req;
        const supplierService = new SupplierService();
        const supplier = await supplierService.addUser(body);
        if (supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess("Successfully Added the supplier", supplier);
        res.status(success.status).send(success);
    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}



module.exports.getAll = async (req, res) => {
    try {
        let result = await new SupplierService().getAll(req);
        let response;

        if (result.suppliers.length)
            response = new OKSuccess("Successfully Retrive the suppliers", result);
        else
            response = new NotFoundError({ mesg: "No supplier in the database" });

        res.status(response.status).send(response);

    }
    catch (err) {
        res.status(500).send(err);
    }
}

module.exports.supplierProfile = async (req, res) => {

    try {
        const { user } = req;
        console.log("user", user)
        let response;
        let url = '';
        let supplier = await Supplier.findOne({ id: user, isDelete: false })
        if (supplier) {
            if (supplier.profilePicture) {
                url = await convertImage(supplier.profilePicture)
            }
            supplier = Object.assign(supplier.toObject(), { url })
            response = new OKSuccess("User details", supplier)
        } else
            response = new NotFoundError("No Record Found", supplier);
        res.status(response.status).send(response);

    }
    catch (err) {
        console.log("Yousuf", err)
        return res.status(500).send(err);
    }
}
module.exports.getOne = async (req, res) => {

    try {
        const { id } = req.params;
        let response;
        let supplier = await Supplier.findOne({ id, isDelete: false }).populate("service", "name isActive baseCharges image").populate("serviceCategory", "serviceName isActive baseCharges image").populate("admin", "name email phoneNumber isActive accountType")
        if (supplier) {
            if (supplier.profilePicture) {
                supplier.profilePicture.url = await convertImage(supplier.profilePicture)
            }
            response = new OKSuccess("User details", supplier)
        } else
            response = new NotFoundError("No Record Found", supplier);
        res.status(response.status).send(response);
    }
    catch (err) {
        return res.status(500).send(err);
    }
}

module.exports.removesupplier = async (req, res) => {
    try {

        const supplier = await new SupplierService().userDetail(req, 'isDelete');
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}

module.exports.supplierStatus = async (req, res) => {
    try {

        const supplier = await new SupplierService().userDetail(req, 'isActive');
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}

module.exports.supplierOnline = async (req, res) => {
    try {

        const supplier = await new SupplierService().userDetail(req, 'isOnline');
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}


module.exports.editUser = async (req, res) => {
    try {
        const { body, user } = req;
        let id = user;
        const supplier = await new SupplierService().updateUser({ body, id, req });
        if (supplier.status === 404 || supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        console.log("err", err)
        return res.status(err.status).send(err);
    }
}


module.exports.sendOTPToUser = async (req, res) => {
    try {
        console.log("user", req.body)
        const { body } = req;
        const { phoneNumber } = body;
        const isRegisterUser = await Supplier.findOne({ phoneNumber, isDelete: false, isActive: true });
        if (!isRegisterUser) {
            return res.status(400).send(new NotFoundError("Not Found", isRegisterUser))
        }
        const userServices = new SupplierService();
        const generatedOTPForUser = await userServices.generateOTP(isRegisterUser);
        console.log("generatedOTPForUser", generatedOTPForUser);
        const success = new OKSuccess({ message: "OTP has been send", generatedOTPForUser });
        res.status(success.status).send(success);
    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}
module.exports.OTPVerification = async (req, res) => {
    try {
        const { body } = req;
        const { phoneNumber, code } = body;
        const isRegisterUser = await Supplier.findOne({ phoneNumber, isDelete: false, isActive: true });
        if (!isRegisterUser) {
            return res.status(400).send(new NotFoundError("Not Found", isRegisterUser))
        }
        const userServices = new SupplierService();
        const verifiedOTP = await userServices.verifyOTP(isRegisterUser, code);
        const response = verifiedOTP.status === 401 ? verifiedOTP : new OKSuccess("Supplier details", verifiedOTP)
        res.status(response.status).send(response);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

module.exports.supplierGeneratePDF = async (req, res) => {
    var data;
    try {
        const { id } = req.params;
        console.log('AppId: ', id)
        const result = await new SupplierService(id).supplierPDF();
        //   console.log('result : ', result.supplierDetail);

        var pdfService = new PDFService(result.supplierDetail);
        data = await pdfService.createSupplierPDF(id);
        console.log("PDF PATH: ", data);

        var readStream = fs.createReadStream(data);
        readStream.pipe(res);
        return res;

    }
    catch (err) {
        console.log("err", err)
        res.status(401).send(err);
    }
    finally {
        fs.unlink(data, function (err) {
            if (err) throw err;
            // if no error, file has been deleted successfully
            console.log('File deleted!');
        });
    }
}

module.exports.supplierVerify = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req;
     
        // const image = await new ImageService().uploadFileToBlob(req.files.nic_front[0]);

        const supplier = await new SupplierService().verifySupplier({ body, id, req });
        if (supplier.status === 404 || supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

module.exports.supplierWitness = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const supplier = await new SupplierService().supplierWitness({ body, id, req });
        if (supplier.status === 404 || supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

module.exports.supplierService = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const supplier = await new SupplierService().supplierService({ body, id, req });
        if (supplier.status === 404 || supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

module.exports.removeSupplierService = async (req, res) => {
    try {
        const { id, serviceID } = req.params;
        const { body } = req;
        const supplier = await new SupplierService().removeSupplierService({ body, id, serviceID, req });
        if (supplier.status === 404 || supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}


module.exports.removeWitness = async (req, res) => {
    try {
        const { id, witnessID } = req.params;
        const { body } = req;
        const supplier = await new SupplierService().removeSupplierwitness({ body, id, witnessID, req });
        if (supplier.status === 404 || supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

module.exports.verification = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const supplier = await new SupplierService().verification({ body, id, req });
        if(supplier.status === "approved"){
            const emailService = await new EmailService().sendEmailInvite("", supplier,"supplierApproved", "approved");
        }
        if (supplier.status === 404 || supplier.status === 409) {
            return res.status(supplier.status).send(supplier);
        }
        const success = new OKSuccess({ message: "Supplier Information updated ", supplier });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

