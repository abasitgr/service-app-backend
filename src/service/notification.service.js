const NotificationModel = require("../model/notification.model");
const { Pagination } = require("../utils/pagination");
const { notificationType } = require("../enums")
const { push_notification } = require('../utils/push-notification')
const { OKSuccess } = require('../utils/success')

const {
    ConfictError,
    InternalServerError,
    UnauthorizedError,
    NotFoundError
} = require('../utils/error')

class Notification {


    async getAll(data) {
        try {
            let skip = data.query.skip;
            var mysort = { createdAt: -1 };
            let perPage = data.query.page;
            let unRead;

            const notification = await NotificationModel.find({
                $or: [{ type: notificationType.USER_CREATED }, { type: notificationType.CUSTOMER_SUPPORT }]
            })
                .sort(mysort)
                .limit(parseInt(perPage))
                .skip(parseInt(skip * parseInt(perPage)));
            unRead = notification.filter(f => f.isRead === false).length;
            if (notification.length >= 1) {
                const count = await NotificationModel.countDocuments();
                let pagination = await Pagination(count, perPage, skip);
                console.log("notificaiton: ", notification);
                return { notification, pagination, unRead }
            } else {
                return notification;
            }
        }

        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }
    }

    async read(id, req) {
        try {
            const notification = await NotificationModel.findOne({ id: id });
            if (!notification) throw new NotFoundError({ message: `Notification is not available by this id: ${id}` });
            notification.isRead = true;
            notification.readBy.push({
                readerId: req.user,
                readAt: new Date()
            })
            let saveNotification = new NotificationModel(notification);
            const notificatioSave = await saveNotification.save();
            return notificatioSave;

        }

        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }
    }

    //job Notifications functions

    async getJobNotifications(req) {
        try {
            const { skip, perPage } = req.query;
            const notifications = await NotificationModel
                .find({ sentTo: { $in: req.user } })
                .sort('-createdAt')
                .limit(parseInt(perPage))
                .skip(parseInt(skip * parseInt(perPage)));

            if (notifications.length >= 1) {
                const count = await NotificationModel.countDocuments({ sentTo: { $in: req.user } });
                let pagination = await Pagination(count, perPage, skip)
                return new OKSuccess("Available notifications: ", { pagination, notifications })
            }
            else {
                return new NotFoundError('No notifications Available')
            }
        }
        catch (err) {
            return new InternalServerError(err);
        }
    }

    capitalizeFirstLetter(string) {
        console.log("string",string);
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    async createJobNotification(userData, serviceData, jobData, suppliersData) {
        try {
            console.log("In notificaiton");
            console.log("userData",userData?.name);
            console.log("suppliersData",suppliersData);
            
            let serviceName = serviceData.name ? serviceData.name : serviceData.serviceName;
            let body = {
                'type': notificationType.JOB_REQUEST,
                'content': {
                    'title': 'Job invitation',
                    'message': `New job request from ${this.capitalizeFirstLetter(userData.name)} for ${this.capitalizeFirstLetter(serviceName)} service.`,
                    'uniqueIdentity': jobData.id
                },
                'sentTo': [],
                'createdAt': new Date()
            }

            let sendedId = [];
            for (let i = 0; i < suppliersData.data.length; i++) {
                if (suppliersData.data[i].fcmToken.length) {
                    sendedId.push(suppliersData.data[i].id);
                    await push_notification(body.content.title, body.content.message, suppliersData.data[i].fcmToken);
                }
            }

            body['sentTo'] = sendedId;
            console.log("body", body)
            console.log("sendedId", sendedId)
            let notification = new NotificationModel(body)
            const saveNotification = await notification.save()



            return saveNotification;
        }
        catch (err) {
            console.log("notificaiton err",err);
            return err;
        }

    }

    async acceptJobNotification(userData, serviceData, jobData, supplierData) {
        try {
            let body = {
                'type': notificationType.JOB_ACCEPT,
                'content': {
                    'title': 'Job accepted',
                    'message': `Your request for ${this.capitalizeFirstLetter(serviceData.name)} is accepted by ${this.capitalizeFirstLetter(supplierData.name)}`,
                    'uniqueIdentity': jobData
                },
                'sentTo': [userData.id],
                'createdAt': new Date()
            }

            if (userData.fcmToken) {
                await push_notification(body.content.title, body.content.message, userData.fcmToken);
            }

            let notification = new NotificationModel(body)
            const saveNotification = await notification.save()

        }
        catch (err) {
            console.log("err: ", err);
            return err;
        }
    }

    async consumerCancelNotification(supplierData, serviceData, jobData) {
        try {
            let body = {
                'type': notificationType.JOB_CONSUMER_CANCEL,
                'content': {
                    'title': 'Job cancelled',
                    'message': `The job you accepted for ${this.capitalizeFirstLetter(serviceData.name)} is cancelled by the consumer.`,
                    'uniqueIdentity': jobData
                },
                'sentTo': [supplierData.id],
                'createdAt': new Date()
            }

            if (supplierData.fcmToken) {
                await push_notification(body.content.title, body.content.message, supplierData.fcmToken);
            }

            let notification = new NotificationModel(body)
            const saveNotification = await notification.save()
        }
        catch (err) {
            console.log("err: ", err);
            return err;
        }
    }

    async supplierCancelNotification(userData, serviceData, jobData) {
        try {
            let body = {
                'type': notificationType.JOB_SUPPLIER_CANCEL,
                'content': {
                    'title': 'Job cancelled',
                    'message': `The job you requested for ${this.capitalizeFirstLetter(serviceData.name)} is cancelled by the supplier.`,
                    'uniqueIdentity': jobData
                },
                'sentTo': [userData.id],
                'createdAt': new Date()
            }

            if (userData.fcmToken) {
                await push_notification(body.content.title, body.content.message, userData.fcmToken);
            }

            let notification = new NotificationModel(body)
            const saveNotification = await notification.save()
        }
        catch (err) {
            console.log("err: ", err);
            return err;
        }
    }

    async supplierArrivedNotification(userData, jobData, supplierData) {
        try {
            let body = {
                'type': notificationType.JOB_SUPPLIER_ARRIVED,
                'content': {
                    'title': 'Supplier is arrived',
                    'message': `Your supplier ${this.capitalizeFirstLetter(supplierData.name)} is arrived.`,
                    'uniqueIdentity': jobData
                },
                'sentTo': [userData.id],
                'createdAt': new Date()
            }

            if (userData.fcmToken) {
                await push_notification(body.content.title, body.content.message, userData.fcmToken);
            }

            let notification = new NotificationModel(body)
            const saveNotification = await notification.save()
        }
        catch (err) {
            console.log("err: ", err);
            return err;
        }
    }

    async declinedJobNotification(userId, userData, jobData) {
        try {
            let body = {
                'type': notificationType.JOB_DECLINED,
                'content': {
                    'title': 'Job Declined',
                    'message': `No supplier is currently active, your job is declined. Please try later.`,
                    'uniqueIdentity': jobData
                },
                'sentTo': [userId],
                'createdAt': new Date()
            }


            if (userData) {
                await push_notification(body.content.title, body.content.message, userData);
            }

            let notification = new NotificationModel(body)
            const saveNotification = await notification.save()
        }
        catch (err) {
            console.log("err: ", err);
            return err;
        }
    }

    async completedJobNotification(userData, serviceData, jobData, supplierData) {
        try {
            let body = {
                'type': notificationType.JOB_COMPLETED,
                'content': {
                    'title': 'Job completed',
                    'message': `Your job for ${this.capitalizeFirstLetter(serviceData.name)} is completed.`,
                    'uniqueIdentity': jobData
                },
                'sentTo': [userData.id, supplierData.id],
                'createdAt': new Date()
            }

            if (userData.fcmToken) {
                await push_notification(body.content.title, body.content.message, userData.fcmToken);
            }

            if (supplierData.fcmToken) {
                await push_notification(body.content.title, body.content.message, supplierData.fcmToken);
            }

            let notification = new NotificationModel(body)
            const saveNotification = await notification.save()
        }
        catch (err) {
            console.log("err: ", err);
            return err;
        }
    }

    //job Notification functions ended

}

module.exports = Notification;
