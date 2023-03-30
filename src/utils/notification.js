var admin = require("firebase-admin");

var serviceAccount = require("../constants/homeplug-324611-firebase-adminsdk-63i5o-0663def268.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://homeplug-324611-default-rtdb.firebaseio.com"
});
var registrationToken = "fuc4rqiaM76iVwmP6nQ9C5:APA91bFhw1FqwHUu634cxoOWV709l8eq12cOMgWdt07DSgAUVpNmOYQlR6ANPt1BuvBevwr2BH7JT_O_XEYVZ44xq-L-5hv0yUQV-TwZReWgoHRzH7_0VW8cCbslBJpjUOUsbseMoxoC";

module.exports = {
    notificationSent: async (data) => {
        console.log("data ", data)

        const message = {
            notification: {
                title: data.type === "user-created" ? "Supplier Registered" : "Customer Support",
                body: data.content
            },
            topic: "admins"
        }

        admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });

    },

    addToNotification: async (data) => {
        console.log("data 36 ", data)
        admin.messaging().subscribeToTopic(data, "admins")
            .then((response) => {
                console.log('Successfully subscribed to topic:', response);
            })
            .catch((error) => {
                console.log('Error subscribing to topic:', error);
            });
    }

};

