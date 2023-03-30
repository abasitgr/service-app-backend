const Supplier = require('../model/supplier.model');
const Wallet = require('../model/wallet.model');
const User = require('../model/user.model');
const Jobs = require('../model/jobs.model');
const { ConfictError, InternalServerError, UnauthorizedError, NotFoundError } = require("../utils/error");
const { OKSuccess } = require("../utils/success");
const { PenaltyCharges } = require('../constants');
const { findOne } = require('../model/supplier.model');
const { walletType, accountType, paymentStatus, walletMainType } = require("../enums")
const moment = require("moment");
const { Pagination } = require("../utils/pagination");

class WalletService {

    async getTransaction(id) {
        try {
            // console.log("id: ", id)
            const isWallet = await Wallet.aggregate([
                {
                    $lookup: {
                        from: Jobs.collection.name,
                        localField: "jobId",
                        foreignField: "id",
                        as: "jobDetail",
                    }
                },
                {
                    $match: { "jobId": id },
                },
                {
                    "$group": {
                        "_id": id,
                        "charges": {
                            $push: {
                                "baseCharge": "$jobDetail.charges.baseCharge",
                                "equipmentCharge": "$jobDetail.charges.equipmentCharge",
                                "totalCharge": "$jobDetail.charges.totalCharge",
                            }
                        },
                        "transaction": {
                            $push: "$transaction"
                        }
                    }
                },
                {
                    $facet: {
                        data: [
                            {
                                $project: {
                                    // _id: 1,
                                    // charges: 1,
                                    transaction: 1
                                }
                            }
                        ]
                    }
                },

            ]);
            // console.log("isWallet: ", isWallet);
            // if (!isWallet) throw new NotFoundError({ message: `Wallet not Found by id: ${id}` });
            return isWallet

        }
        catch (err) {
            throw new InternalServerError({ data: err });
        }
    }

    async depositBalance(id, body, admin) {
        try {
            const { amount } = body;
            const isSupplier = await Supplier.findOne({ id: id, isActive: true, isDelete: false });
            if (!isSupplier) throw new NotFoundError({ message: `Supplier not Found by id: ${id}` });
            isSupplier.balance = isSupplier.balance + amount;
            let transaction = await this.openingBalance(id, amount, admin);
            await isSupplier.save();
            return isSupplier.balance, transaction;

        }
        catch (err) {
            throw new InternalServerError({ data: err });
        }
    }

    async jobDone(jobDetail, amount) {
        try {
            const isWallet = await Wallet.findOne({ jobId: jobDetail.data.id });
            if (isWallet) {
                throw new ConfictError({ message: `Wallet already exsit this id: ${jobDetail.data.id}` });
            }
            let transaction = await this.job(jobDetail.data, amount, "done");
            return transaction;
        } catch (err) {
            throw new InternalServerError({ message: `Job Done Transaction Error`, data: err });
        }
    }

    async jobCancel(jobDetail) {
        try {
            // console.log("jobDetail:", jobDetail);
            let amount = 50;
            if (jobDetail.status === "cancel") {
                amount = 150;
            }
            let transaction = await this.job(jobDetail, amount, 'cancel', jobDetail.status);
            // return transaction;
        }
        catch (err) {
            throw new InternalServerError({ message: `Cancel Transaction Error`, data: err });
        }
    }

    async getWeekSubmission(supplier) {
        try {
            const walletDetail = await Wallet.aggregate([
                {
                    $match: {
                        "status": "opened",
                        "transaction.id": supplier.id,
                        $or: [
                            { "transaction.type": "payable" },
                            { "transaction.type": "penalty" },
                        ],
                    },
                },
                {
                    "$group": {
                        "_id": supplier.id,
                        "payable": {
                            "$sum":
                            {
                                "$let": {
                                    "vars": {
                                        "dw": {
                                            "$filter": {
                                                "input": "$transaction",
                                                "cond": {
                                                    $or: [
                                                        { $eq: ["$$this.type", "payable"] },
                                                        { $eq: ["$$this.type", "penalty"] },
                                                    ]
                                                }
                                            }
                                        }

                                    },
                                    "in": { "$sum": "$$dw.amount" },
                                },
                            }
                        },
                        "detail": {
                            $push: {
                                "type": "$type",
                                "jobId": "$jobId",
                                "amount": "$amount",
                                "transaction": "$transaction"
                            }
                        },
                        "transaction": {
                            $push: "$transaction"
                        }
                    }
                },
                {
                    $facet: {
                        data: [
                            {
                                $project: {
                                    _id: 1,
                                    detail: 1,
                                    jobId: 1,
                                    amount: 1,
                                    status: 1,
                                    id: 1,
                                    createdAt: 1,
                                    updatedAt: 1,
                                    payable: 1,
                                    // transaction: 1
                                    // total : { 
                                    //     $sum: {
                                    //         "$let": {
                                    //             "vars": {
                                    //                 "dw": {
                                    //                     "$filter": {
                                    //                         "input": "$transaction",
                                    //                         "cond": { "$eq": ["$$this.type", "payable"] }
                                    //                     }
                                    //                 }
                                    //             },
                                    //             "in": { "$sum": "$$dw.amount" },
                                    //         },
                                    //     }
                                    // }
                                }
                            }
                        ]
                    }
                },


            ]);

            // console.log("wallet", walletDetail[0].data);

            return walletDetail[0].data

        }
        catch (err) {
            throw new InternalServerError({ message: `Transaction Error`, data: err });
        }
    }

    async weekSubmission(admin, data, supplier) {
        try {

            let wallet = await Wallet.find({ "jobId": { $in: data.job } });
            if (!wallet.length) throw new ConfictError({ message: `Data not exsit these jobIds: ${data.job}` });

            const transaction = await this.weekSubmit(admin, data, supplier);
            for (let i = 0; i < wallet.length; i++) {
                if (wallet[i].status !== "closed") {
                    wallet[i].status = "closed";
                    wallet[i].save();
                }
            }

            return transaction


        }
        catch (err) {
            throw new InternalServerError({ message: `Transaction Error`, data: err });
        }
    }

    async getAll(supplier, accountType, req) {

        try {
            console.log("supplier", supplier)
            console.log("accountType", accountType)
            let { skip, perPage, } = req.query;
            let record = [];

            record.push({
                $project: {
                    _id: 1,
                    detail: 1,
                    job: 1,
                    // count: 1
                },
            })
            // const walletDetail = await Wallet.aggregate([
            //     {
            //         $match: { "transaction.id": supplier.id, "transaction.accountType": accountType },
            //     },
            //     {
            //         $lookup: {
            //             from: Jobs.collection.name,
            //             localField: "jobId",
            //             foreignField: "id",
            //             as: "jobDetail",
            //         },
            //     },
            //     {
            //         $unwind: "$jobDetail"
            //     },
            //     {
            //         $facet: {
            //             pageInfo: [
            //                 { $group: { _id: null, count: { $sum: 1 } } },
            //             ],
            //             data: [
            //                 { $sort: { 'createdAt': -1 } },
            //                 { $skip: parseInt(skip * parseInt(perPage)) },
            //                 { $limit: parseInt(perPage) },
            //                 {
            //                     $project: {
            //                         _id: 1,
            //                         jobId: 1,
            //                         amount: 1,
            //                         transaction: {
            //                             "$filter": {
            //                                 "input": "$transaction",
            //                                 "cond": { "$eq": ["$$this.accountType", accountType] }
            //                             }
            //                         },
            //                         jobDetail: 1
            //                     }
            //                 }
            //             ],
            //         }
            //     },
            // ]);
            const walletDetail = await Wallet.aggregate([
                {
                    $lookup: {
                        from: Jobs.collection.name,
                        localField: "jobId",
                        foreignField: "id",
                        as: "jobDetail",
                    },
                },
                {
                    $unwind: "$jobDetail"
                },
                {
                    $match: { "transaction.id": supplier.id },
                },
                { $skip: parseInt(skip * parseInt(perPage)) },
                { $limit: parseInt(perPage) },
                {
                    "$group": {
                        "_id": supplier.id,
                        "detail": {
                            $push: {
                                "jobId": "$jobId",
                                "amount": "$amount",
                                "transaction": {
                                    "$filter": {
                                        "input": "$transaction",
                                        "cond": { "$eq": ["$$this.accountType", accountType] }
                                    }
                                }
                            }
                        },
                        "job": {
                            $push: {
                                job: "$jobDetail"
                            }
                        }
                    }
                },
                { $sort: { 'createdAt': -1 } },
                {
                    $facet: {
                        data: record,
                    }

                }
            ]);
            console.log("wa 305", walletDetail[0]);
            return walletDetail

        }
        catch (err) {
            console.log("error 309", err);
            throw new InternalServerError({ message: `Get Wallet Detail`, data: err });
        }
    }

    async getAllSupplier(req, type) {

        try {
            let skip, perPage;
            if (type !== 'batch') {
                skip = req.query.skip
                perPage = req.query.perPage
            } else {
                skip = '0';
                perPage = '100';
            }

            const walletDetail = await Wallet.aggregate([
                {
                    $lookup: {
                        from: Jobs.collection.name,
                        localField: "jobId",
                        foreignField: "id",
                        as: "jobDetail",
                    },
                },
                {
                    $unwind: "$jobDetail"
                },
                {
                    $lookup: {
                        from: Supplier.collection.name,
                        localField: "jobDetail.supplier.supplierId",
                        foreignField: "id",
                        as: "supplierDetail"
                    }
                },
                { $unwind: "$supplierDetail" },
                {
                    $match: { "status": "opened" },
                },
                {
                    "$group": {
                        "_id": "$jobDetail.supplier.supplierId",
                        "detail": {
                            $push: {
                                jobId: "$jobDetail.id",
                                walletId: "$id",
                                payable: "$amount",
                                supplierDetail: {
                                    "name": "$supplierDetail.name",
                                    "email": "$supplierDetail.email"
                                }
                            }
                        },
                    }
                },
                {
                    $project: {
                        "detail": 1,
                    }
                },
                {
                    $facet: {
                        data: [
                            { $sort: { 'createdAt': -1 } },
                            { $skip: parseInt(skip * parseInt(perPage)) },
                            { $limit: parseInt(perPage) },
                        ],
                        pageInfo: [
                            { $group: { _id: null, count: { $sum: 1 } } },
                        ],
                    },
                },
            ]);
            let pagination = await Pagination(walletDetail[0].pageInfo[0].count, perPage, skip)
            console.log("pagination: ", pagination)
            let newData = {
                walletDetail: walletDetail[0],
                pagination: pagination
            }
            return newData

        }
        catch (err) {
            console.log("error", err);
            throw new InternalServerError({ message: `Get Wallet Detail`, data: err });
        }
    }

    // 3 main functions for wallet types
    async openingBalance(id, amount, admin) {
        try {
            let transactionType = {
                type: walletMainType.OPENING_BALANCE,
                amount,
                transaction: [
                    {
                        type: walletType.DEPOSIT,
                        amount,
                        time: new Date(),
                        accountType: accountType.SUPPLIER,
                        id
                    },
                    {
                        type: walletType.RECIVED,
                        amount,
                        time: new Date(),
                        accountType: accountType.ADMIN,
                        id: admin
                    },
                ]
            }

            let saveTransaction = await new Wallet(transactionType);
            await saveTransaction.save();

            return saveTransaction

        }
        catch (err) {
            throw new InternalServerError({ message: `Transaction Error`, data: err });
        }


    }

    async job(jobDetail, amount, type, status) {
        try {

            // console.log("jobDetail: ", jobDetail)
            console.log("amount: ", amount)
            console.log("type: ", type);
            console.log("status: ", status);

            const userDetail = await User.findOne({ id: jobDetail.user.userId });
            const supplierDetail = await Supplier.findOne({ id: jobDetail.supplier.supplierId });

            let payable;
            let balance = jobDetail.users[0].balance
            let fare = jobDetail.charges.totalCharge + jobDetail.charges.equipmentCharge + jobDetail.charges.baseCharge;
            let earning = jobDetail.charges.totalCharge + jobDetail.charges.baseCharge;
            let topup = 0;
            let deduction = 0;
            deduction = fare;
            if (fare >= balance) {
                deduction = balance;
            }
            let newFare = fare - balance;
            console.log("newFare", newFare);
            if (amount > newFare) {
                topup = amount - fare + balance
            }
            payable = (earning * 0.2) + topup - balance;
            // console.log("fare", fare);
            // console.log("deduction:", deduction)
            // console.log("earning", earning);
            // console.log("payable", payable);
            // console.log("consumer balance", balance)
            // console.log("topup", topup);
            // console.log("////")

            let transactionType = {
                type: walletMainType.JOB,
                jobId: jobDetail.id,
                amount,
                status: paymentStatus.OPENED,
                transaction: []
            }

            if (type === "cancel") {
                transactionType.transaction.push(
                    {
                        type: amount === 50 ? walletType.PENALTY : walletType.CANCELLATION,
                        time: new Date(),
                        accountType: amount === 50 ? accountType.SUPPLIER : accountType.CONSUMER,
                        id: amount === 50 ? jobDetail.supplier.supplierId : jobDetail.user.userId,
                        amount
                    }
                )
            }

            if (type !== "cancel") {
                transactionType.transaction.push(
                    {
                        type: walletType.FARE,
                        time: new Date(),
                        accountType: accountType.CONSUMER,
                        id: jobDetail.user.userId,
                        amount: fare
                    },
                    {
                        type: walletType.EARNING,
                        time: new Date(),
                        accountType: accountType.SUPPLIER,
                        id: jobDetail.supplier.supplierId,
                        amount: earning
                    },
                    {
                        type: walletType.PAYABLE,
                        time: new Date(),
                        accountType: accountType.SUPPLIER,
                        id: jobDetail.supplier.supplierId,
                        amount: payable
                    },
                )

            }

            if (payable < 0) {
                let depositObj = {
                    type: walletType.DEPOSIT,
                    amount: Math.abs(payable),
                    time: new Date(),
                    accountType: accountType.SUPPLIER,
                    id: jobDetail.supplier.supplierId,
                }
                transactionType.transaction.push(depositObj);
            }
            if (balance > 0) {
                let dedObj = {
                    type: walletType.DEDUCTION,
                    time: new Date(),
                    accountType: status === "partner-cancel" ? accountType.SUPPLIER : accountType.CONSUMER,
                    id: status === "partner-cancel" ? jobDetail.supplier.supplierId : jobDetail.user.userId,
                    amount: deduction
                }
                transactionType.transaction.push(dedObj)
            }

            if (topup > 0 && type !== "cancel" && newFare < amount) {
                let topupObj = {
                    type: walletType.TOPUP,
                    time: new Date(),
                    accountType: accountType.CONSUMER,
                    id: jobDetail.user.userId,
                    amount: topup
                }
                transactionType.transaction.push(topupObj)
            }
            for await (let i of transactionType.transaction) {
                if (i.type === walletType.TOPUP ||
                    i.type === walletType.CANCELLATION ||
                    i.type === walletType.DEDUCTION) {
                    console.log("userBalance 1 ", userDetail.balance, i.type)

                    if (type === "cancel" && i.type === walletType.DEDUCTION && status === "cancel") {

                        userDetail.balance -= i.amount;
                        console.log("userBalance 3", userDetail.balance, i.type)

                    }
                    if (i.type === walletType.TOPUP) {
                        userDetail.balance += i.amount;
                    }
                    await userDetail.save();
                }

                if (i.type === walletType.PAYABLE || i.type === walletType.PENALTY || i.type === walletType.DEPOSIT) {
                    if (type === "cancel") {
                        supplierDetail.balance -= i.amount;
                    }

                    if (i.type === walletType.DEPOSIT) {
                        supplierDetail.balance += i.amount;
                    }
                    if (i.type === walletType.PAYABLE) {
                        console.log("supp", supplierDetail.balance);
                        console.log("2", i.amount);

                        supplierDetail.balance -= i.amount;
                    }
                    console.log("supp", supplierDetail.balance);
                    await supplierDetail.save();
                }


            }

            let saveTransaction = await new Wallet(transactionType);
            await saveTransaction.save();
            return transactionType
        } catch (err) {
            console.log("errr: ", err);
            throw new InternalServerError({ message: `Transaction Error`, data: err });
        }
    }

    async weekSubmit(admin, data, supplier) {
        try {
            let supplierBalance = await Supplier.findOne({ id: supplier.id });
            let checkBal = await this.getWeekSubmission(supplier);

            if (data.amount < checkBal[0].payable) throw new InternalServerError({ message: `Amount should be greater`, data: err });

            let deposit = data.amount - checkBal[0].payable;
            let transactionType = {
                type: walletMainType.WEEKLY_TRANSACTION,
                amount: data.amount,
                transaction: [
                    {
                        type: walletType.RECIVED,
                        amount: data.amount,
                        time: new Date(),
                        accountType: accountType.ADMIN,
                        id: admin
                    },
                    {
                        type: walletType.PAID,
                        amount: checkBal[0].payable,
                        time: new Date(),
                        accountType: accountType.SUPPLIER,
                        id: supplier.id
                    }
                ]
            }
            if (deposit > 0) {
                transactionType.transaction.push({
                    type: walletType.DEPOSIT,
                    amount: deposit,
                    time: new Date(),
                    accountType: accountType.SUPPLIER,
                    id: supplier.id
                });
            }
            supplierBalance.balance += parseInt(data.amount);

            let saveTransaction = await new Wallet(transactionType);
            supplierBalance.save();
            await saveTransaction.save();
            return saveTransaction

        }
        catch (err) {
            console.log("err: 533", err)
            throw new InternalServerError({ message: `Week submit Transaction Error`, data: err });
        }


    }


}

module.exports = WalletService;
