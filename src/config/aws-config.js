const development = {
    S3: {
        Bucket: "homeplug",
        AccessKeyId: process.env.AWS_ACCESS_KEY,
        SecretAccessKey: process.env.AWS_SECRET_KEY,
        UserFolder: "user",
        ServiceFolder: "service",
        MainServiceFolder: "sub-category"
    },

    Notify: {
        url: "https://fcm.googleapis.com/fcm/send",
        token: "AAAAMjI9x7M:APA91bE1BR9m0k6hSRBLtBsPhO57a19yF-JBbI4bjqzIdQoyHKoztCr5Fmt6bVEZ37WQQmlTWEI10n2QNU89Yo6C7bWw140fdTY_OVzpSoySjt-YfdmbsBH4szmwbFfmaku-L6_N9u5u"
    }
};

module.exports = development;
