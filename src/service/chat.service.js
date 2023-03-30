const {
    ConfictError,
    InternalServerError,
    UnauthorizedError,
    NotFoundError
} = require('../utils/error')
const { OKSuccess } = require('../utils/success')
const Chat = require('../model/chat.model')
const User = require('../model/user.model')
const Supplier = require('../model/supplier.model')
const Admin = require('../model/admin.model')


const Notification = require('../model/notification.model');
const { notificationSent } = require("../utils/notification");

const { chatStatus } = require('../enums')
const { Pagination } = require('../utils/pagination')


class ChatService {

    constructor() { }


    async createRoom(data) {
        try {
            const { room, id, accountType, jobId } = data;

            const validate = await Chat.findOne({ roomId: room, jobId: jobId, $or: [{ status: chatStatus.PENDING }, { status: chatStatus.ACCEPTED }] })
            console.log("validate", validate);


            if (validate) {
                return new InternalServerError("Chat already open with this job id: ", jobId);
            }


            if (!id || !accountType) {
                return new InternalServerError("No user id or account type received!");
            }


            let obj = {
                'user': [
                    {
                        'accountType': accountType,
                        'userId': id,
                    }
                ],
                'jobId': jobId,
                'status': chatStatus.PENDING
            }

            if (room) {
                obj['roomId'] = room;
            }




            let chat = new Chat(obj)
            let result = await chat.save()
            
             let notificationBody = {
            type: "customer-support",
            // content: `Chat has been opened by ${accountType} with ID: ${id}`,
            content:{
                title:"customer-support",
                message: `Chat has been opened by ${accountType} with ID: ${id}`,
                uniqueIdentity: id
            },
        }
        let test = notificationSent(notificationBody)
        let notification = new Notification(notificationBody);
        const notificatioSave = await notification.save();

            if (!room) {
                console.log("new generated Room Id: ", result.roomId);
                let finalize;
                if (accountType === "consumer") {
                    let exist = await User.findOne({ id })
                    if (exist) {
                        exist['roomId'] = result.roomId;
                    }
                    finalize = new User(exist);
                }

                if (accountType === "supplier") {
                    let exist = await Supplier.findOne({ id })
                    if (exist) {
                        exist['roomId'] = result.roomId;
                    }
                    finalize = new Supplier(exist);
                }

                let saveRoomId = await finalize.save();

            }

            return new OKSuccess("chat created", result);
        }

        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }

    }

    async acceptChat(data) {
        try {
            const { id, accountType, chatId } = data;

            const validate = await Chat.findOne({ id: chatId, status: chatStatus.PENDING })
            console.log("validate", validate);

            if (!validate) {
                return new InternalServerError("No chat exist!: ", chatId);
            }

            let { user, status } = validate;

            user.push({
                'accountType': accountType,
                'userId': id,
            });

            validate['status'] = chatStatus.ACCEPTED;

            let result = await validate.save();
            return new OKSuccess("chat accepted", result);
            return result;
        }

        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }
    }

    async endChat(data) {
        try {
            const { chatId } = data;

            const validate = await Chat.findOne({ id: chatId, status: chatStatus.ACCEPTED })
            console.log("validate", validate);

            if (!validate) {
                return new InternalServerError("No chat exist!: ", chatId);
            }

            let { status } = validate;


            validate['status'] = chatStatus.END;

            let result = await validate.save();
            return new OKSuccess("chat ended", result);
            return result;
        }

        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }
    }

    async joinRoom(data) {
        try {
            const { chatId } = data;

            const validate = await Chat.findOne({ id: chatId })
            console.log("validate", validate);

            if (!validate) {
                return new InternalServerError("No Chat exist with this id: ", chatId);
            }

            return new OKSuccess("chat exists", validate);
        }

        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }

    }

    async sendMessage(data) {
        try {
            const { message, from, chatId } = data;

            const validate = await Chat.findOne({ id: chatId })
            console.log("validate", validate);

            if (!validate) {
                return new InternalServerError("No chat exist with this id: ", chatId);
            }


            const { messages } = validate;

            let obj = {
                message,
                from,
                time: new Date(),
                seen: false
            };

            messages.push(obj);


            let result = await validate.save()
            return new OKSuccess("message saved", obj);
        }

        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }

    }

    async getAll(req) {
        let { _search, skip, perPage, accountType, status } = req.query;

        let filter = {
            "status": status,
            $or: [
                { "supplierInfo.name": { $regex: _search, $options: "i" } },
                { "userInfo.name": { $regex: _search, $options: "i" } },
            ],
        }

        if (status === "accepted" || status === "end") {
            filter['user.userId'] = req.user;
        }


        try {
            let record = [];
            if (skip >= 0) {
                if (perPage > 0) {
                    record.push({ $skip: _search ? 0 : Number(skip) * Number(perPage) });
                }
            }
            if (perPage > 0 && skip >= 0) {
                record.push({ $limit: Number(perPage) })

            }
            record.push({
                $project: {
                    roomId: 1,
                    id: 1,
                    consumerName: "$userInfo.name",
                    supplierName: "$supplierInfo.name",
                    jobId: 1,
                    status: 1,
                    messages: { $slice: ["$messages", -1] },
                    "unread_messages": {
                        "$size": {
                            "$filter": {
                                "input": "$messages",
                                "cond": { "$and": [{ "$eq": ["$$this.seen", false] }, { "$ne": ["$$this.from", req.user] }] }
                            }
                        }
                    }
                },

            })


            let chats = await Chat.aggregate([
                {
                    $lookup: {
                        from: (accountType === "Supplier" ? Supplier.collection.name : User.collection.name),
                        localField: "user.userId",
                        foreignField: "id",
                        as: accountType === "Supplier" ? "supplierInfo" : "userInfo",
                    },


                },
                {
                    $unwind: accountType === "Supplier" ? "$supplierInfo" : "$userInfo",
                },

                {
                    $match: filter,
                },
                { $sort: { 'createdAt': -1 } },
                {
                    $facet: {
                        count: [{ $count: "total" }],
                        data: record
                    },
                },
            ]);
            chats.options = { allowDiskUse: true };
            console.log("chats", chats)
            let total = chats[0]?.count[0]?.total;
            let pagination = total !== undefined && perPage > 0 && skip >= 0 && await Pagination(total, perPage, skip)
            if (pagination) {
                return { chats, pagination }
            }
            else {
                return { chats }
            }
        }
        catch (err) {
            console.log("err" + err);
            throw new InternalServerError(err);
        }
    }

    async getEnd(req) {
        let { _search, skip, perPage, accountType } = req.query;
        let filter = {
            'user.userId': req.user,
            '_id.status': 'end',
            $or: [
                { "supplierName": { $regex: _search, $options: "i" } },
                { "consumerName": { $regex: _search, $options: "i" } },
            ],
        }

        try {
            let record = [];
            if (skip >= 0) {
                if (perPage > 0) {
                    record.push({ $skip: _search ? 0 : Number(skip) * Number(perPage) });
                }
            }
            if (perPage > 0 && skip >= 0) {
                record.push({ $limit: Number(perPage) })

            }
            record.push({
                $project: {
                    _id: 1,
                    consumerName: 1,
                    supplierName: 1,
                    // user:1,
                    // jobId: 1,
                    // status: 1,
                    // createdAt:1
                    messages: { $slice: ["$messages", -1] }
                },

            })


            let chats = await Chat.aggregate([
                {
                    $lookup: {
                        from: accountType === "Supplier" && Supplier.collection.name || accountType === "Consumer" && User.collection.name,
                        localField: "user.userId",
                        foreignField: "id",
                        as: accountType === "Supplier" ? "supplierInfo" : "userInfo",
                    },


                },
                {
                    $unwind: accountType === "Supplier" ? "$supplierInfo" : "$userInfo",
                },

                {
                    $unwind: "$messages"
                },

                {
                    $group: {

                        _id: { roomId: "$roomId", status: "$status" },
                        "user": {
                            $first: "$user"
                        },
                        messages: { $push: "$messages" },
                        supplierName: { $first: "$supplierInfo.name" },
                        consumerName: { $first: "$userInfo.name" },
                        updatedAt: { $max: "$updatedAt" }
                    }

                },

                {
                    $match: filter,
                },
                { $sort: { 'updatedAt': -1 } },
                {
                    $facet: {
                        count: [{ $count: "total" }],
                        data: record
                    },
                },
            ]);
            chats.options = { allowDiskUse: true };
            console.log("chats", chats)
            let total = chats[0]?.count[0]?.total;
            let pagination = total !== undefined && perPage > 0 && skip >= 0 && await Pagination(total, perPage, skip)
            if (pagination) {
                return { chats, pagination }
            }
            else {
                return { chats }
            }
        }
        catch (err) {
            console.log("err" + err);
            throw new InternalServerError(err);
        }
    }

    async getOne(req) {
        let { id } = req.params;
        let { skip, page } = req.query;

        try {
            let chats = await Chat.aggregate([
                {
                    $match: {
                        "id": id
                    }
                },
                {
                    $unwind: "$messages"
                },
                {
                    $group: {
                        "_id": "$_id",
                        "status": { $first: '$status' },
                        "createdAt": { $first: '$createdAt' },
                        "messages": {
                            $push: "$messages"
                        }
                    }
                },

                {
                    $project: {
                        "createdAt": 1,
                        "total": 1,
                        "status": 1,
                        "totalMessages": { $size: "$messages" },
                        "messages": {
                            $slice: [
                                "$messages",
                                Number(skip),
                                Number(page)
                            ]
                        }
                    }
                }
            ]);

            var objChats = chats;
            if (objChats && objChats.length > 0) {
                console.log("me:", req.user);
                for (let i = 0; i < objChats[0].messages.length; i++) {
                    if (objChats[0].messages[i].seen === false && objChats[0].messages[i].from !== req.user) {
                        objChats[0].messages[i].seen = true;
                    }
                }
          
                const res = await Chat.findByIdAndUpdate(objChats[0]._id, {
                    messages: objChats[0].messages
                });
            }
            return chats;
        }
        catch (err) {
            console.log("err" + err);
            return new InternalServerError(err);
        }
    }

    async openChats(req) {
        let { skip, perPage } = req.query;

        let filter = {
            "user.userId": req.user,
            $or: [
                { "status": chatStatus.PENDING },
                { "status": chatStatus.ACCEPTED },
            ]
        }



        try {
            let record = [];
            if (skip >= 0) {
                if (perPage > 0) {
                    record.push({ $skip: Number(skip) * Number(perPage) });
                }
            }
            if (perPage > 0 && skip >= 0) {
                record.push({ $limit: Number(perPage) })

            }
            record.push({
                $project: {
                    roomId: 1,
                    id: 1,
                    jobId: 1,
                    status: 1,
                    createdAt: 1
                },

            })


            let chats = await Chat.aggregate([
                {
                    $match: filter,
                },
                { $sort: { 'createdAt': -1 } },
                {
                    $facet: {
                        count: [{ $count: "total" }],
                        data: record
                    },
                },
            ]);
            chats.options = { allowDiskUse: true };
            console.log("chats", chats)
            let total = chats[0]?.count[0]?.total;
            let pagination = total !== undefined && perPage > 0 && skip >= 0 && await Pagination(total, perPage, skip)
            if (pagination) {
                return { chats, pagination }
            }
            else {
                return { chats }
            }
        }
        catch (err) {
            console.log("err" + err);
            throw new InternalServerError(err);
        }
    }

    async getOldProblems(req) {
        let { roomId } = req.params;
        let { skip, page } = req.query;

        let record = [];
        if (skip >= 0) {
            if (page > 0) {
                record.push({ $skip: Number(skip) * Number(page) });
            }
        }
        if (page > 0 && skip >= 0) {
            record.push({ $limit: Number(page) })
        }
        record.push({
            $project: {
                "createdAt": 1,
                "id": 1,
                "jobId":1,
                "total": 1,
                "status": 1,
                "messages": 1
            }
        })


        try {
            let chats = await Chat.aggregate([
                {
                    $match: {
                        "roomId": roomId,
                        "status": chatStatus.END
                    }
                },
                { $sort: { 'createdAt': -1 } },
                {
                    $facet: {
                        count: [{ $count: "total" }],
                        data: record
                    }
                }
            ]);

            let total = chats[0]?.count[0]?.total;
            let pagination = total !== undefined && page > 0 && skip >= 0 && await Pagination(total, page, skip)
            if (pagination) {
                return { chats, pagination }
            }
            else {
                return { chats }
            }
        }
        catch (err) {
            console.log(err);
            return new InternalServerError(err);
        }
    }


}

module.exports = ChatService