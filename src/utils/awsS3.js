const AWS = require("aws-sdk");
const Config = require("../config/aws-config");
const fs = require("fs");
const S3 = new AWS.S3({
    accessKeyId: Config.S3.AccessKeyId,
    secretAccessKey: Config.S3.SecretAccessKey
});

module.exports = {
    uploadFile: async (file, fileName, folder) => {
        // Read content from the file
        // const fileContent = fs.readFileSync(fileName);

        // Setting up S3 upload parameters

        const params = {
            Bucket: Config.S3.Bucket,
            Key: `${folder}/${fileName}`, // File name you want to save as in S3
            Body: file
        };

        // console.log(`params`, params);

        // Uploading files to the bucket
        try {
            const data = await S3.upload(params).promise();
            console.log('complete uploading');

            let obj = {};
            obj.bucket = data.Bucket;
            obj.key = data.key;
            obj.location = data.Location;
            obj.lastUpdatedAt = new Date()

            //   console.log(`S3 image object ${obj}`);
            return obj;
        } catch (err) {
            console.log(err);
            throw new Error.InternalServerError(
                `Error uploading files to S3 : ${err}`
            );
        }
    },
    downloadFile: async (filePath, bucketName, key) => {
        const params = {
            Bucket: bucketName,
            Key: key
        };
        console.log("params", params);
        return await new Promise((resolve, reject) => {
            S3.getObject(params, (err, data) => {
                if (err) console.error(err);
                // console.log("data", data);
                fs.writeFileSync(filePath, data.Body);
                resolve(filePath);
                console.log(`${filePath} has been created!`);
            });
        });
    }
};
