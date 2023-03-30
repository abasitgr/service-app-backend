const { OKSuccess } = require('../utils/success')
const {
    NotFoundError,
    InternalServerError,
    UnauthorizedError
} = require('../utils/error')
const WalletService = require("../service/wallet.service");
const JobService = require("../service/job.service");
const SupplierService = require("../service/supplier.service");
const ConsumerService = require("../service/user.service");
const { batchTesting } = require("../utils/batch")
const Job = require("../model/jobs.model");
const { accountType } = require("../enums")



module.exports.create = async (req, res) => {
    try {
        const { jobId } = req.body;
        console.log("jobId", jobId);

        const walletService = await new WalletService();

        // const jobDetail = 

        // const { jobId } = body;
        // const { user } = body;
        let response;

        let isJobExist = await Job.findOne({ id: jobId });
        console.log("isJob", isJobExist);

        // let isUserExist;
        // if(user.type === accountType.CONSUMER){
        //     isUserExist = await User.findOne({ id: user.id, isDelete: false });
        // }
        // if(user.type === accountType.SUPPLIER){
        //     isUserExist = await Supplier.findOne({ id: user.id, isDelete: false });
        // }
        // if(user.type === accountType.ADMIN){
        //     isUserExist = await Admin.findOne({ id: user.id, isDelete: false });
        // }


        // if(!isUserExist){
        //   response = new NotFoundError(`No ${user.type} Found`, isUserExist);
        //   res.status(response.status).send(response);
        // }

        if (!isJobExist) {
            response = new NotFoundError("No Job Found", isJobExist);
            res.status(response.status).send(response);
        }

        // const data = await new WalletService().create(body,isJobExist,isUserExist);

        // response = data;
        // res.status(response.status).send(isJobExist)
        res.send(isJobExist)
    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}

module.exports.depositBalance = async (req, res) => {
    try {
        const { id } = req.params;
        const walletService = await new WalletService().depositBalance(id, req.body, req.user);
        const success = new OKSuccess("Successfully Added the transactions", walletService);
        res.status(success.status).send(success);

    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}

module.exports.jobDone = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const jobDetail = await new JobService().getOneJob(id);
        const walletService = await new WalletService().jobDone(jobDetail, amount);
        const success = new OKSuccess("Successfull Transactions", walletService);
        res.status(success.status).send(success);

    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}

module.exports.weeklySubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const supplierDetail = await new SupplierService().getSupplierDetail(id);
        const walletService = await new WalletService().getWeekSubmission(supplierDetail);
        const success = new OKSuccess("Successfull Transactions", walletService);
        res.status(success.status).send(success);

    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}


module.exports.getDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const walletDetail = await new WalletService().getTransaction(id);
        const success = new OKSuccess("walletDetail", walletDetail);
        res.status(success.status).send(success);

    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}

module.exports.weekSubmit = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const supplierDetail = await new SupplierService().getSupplierDetail(id);
        const walletDetail = await new WalletService().weekSubmission(req.user, body, supplierDetail);
        const success = new OKSuccess("walletDetail", walletDetail);
        res.status(success.status).send(success);

    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}

module.exports.getAll = async (req, res) => {
    try {
        const { accountType, id } = req.params;
        let user;
        if (accountType === "supplier") {
            user = await new SupplierService().getSupplierDetail(id);
        }
        if (accountType === "consumer") {
            user = await new ConsumerService().getOneUser(id);
        }
        const walletDetail = await new WalletService().getAll(user, accountType, req);
        const success = new OKSuccess("Supplier wallet records", walletDetail);
        res.status(success.status).send(success);

    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}

module.exports.getAllSupplier = async (req, res) => {
    try {
        console.log("hello 167");
        // batchTesting(req)
        const walletDetail = await new WalletService().getAllSupplier(req);
        const success = new OKSuccess("suppliers", walletDetail);
        res.status(success.status).send(success);

    }
    catch (err) {
        console.log(err);
        res.status(err.status).send(err);
    }
}