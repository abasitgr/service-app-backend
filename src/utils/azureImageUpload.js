const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = {

    uploadFile: async (file, fileName, path, ext) => {
        console.log("file: ", file)
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.CONN_STR);

        const containerClient = blobServiceClient.getContainerClient(process.env.CONTAINER_NAME);
        const blobName = path + "/" + fileName + ext;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.uploadData(file);
        const location = process.env.BLOB_URL + "/" + blobName;
        return location;
    }

};