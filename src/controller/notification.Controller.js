const { notificationSent } = require("../utils/notification");
const Notification = require("../service/notification.service");
const { NotFoundError } = require("../utils/error");

module.exports.notify = async (req, res) => {
    try {
        const { body } = req
        notificationSent(body);
    } catch (err) {
        console.log(err)
    }
}

module.exports.getAll = async (req, res) => {
    try {
        const notification = new Notification();
        const allNotification = await notification.getAll(req);
        console.log("all: ", allNotification)
        res.status(200).send(allNotification)


    }
    catch (err) {
        console.log("err", err)
    }
}

module.exports.read = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = new Notification();
        const allNotification = await notification.read(id, req);

        return res.status(200).send(allNotification);

    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}

module.exports.getAllJobNotifications = async (req, res) => {
    try {
        const notification = new Notification();
        const allNotification = await notification.getJobNotifications(req);
        res.status(allNotification.status).send(allNotification)
    }
    catch (err) {
        console.log("err", err)
        res.status(err.status).send(err)
    }
}