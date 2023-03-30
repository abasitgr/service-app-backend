const fetch = require("node-fetch");
const Config = require("../config/aws-config");
module.exports = {
    push_notification: async (title, body, fcmToken) => {
        fetch(Config.Notify.url, {
            method: "POST",
            headers: {
                Authorization: "key=" + Config.Notify.token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                notification: {
                    title: title,
                    body: body,
                },
                registration_ids: fcmToken
            }),
        })
            .then(() => {
                console.log("Notification send successfully");
                return true;
            })
            .catch((err) => {
                console.log("err", err);
                return false;
            });
    },
};