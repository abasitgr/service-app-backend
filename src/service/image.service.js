const azureStorageConfig = {
    accountName: process.env.STORAGE_ACCOUNT_NAME,
    accountKey: process.env.ACCOUNT_ACCESS_KEY,
    blobURL: "https://demoservergrtech.blob.core.windows.net/images",
    containerName: "images"
};
// const Supplier = require("../images/array.jpg");

const getStreams = require('get-stream');
const multer = require('multer')
const inMemoryStorage = multer.memoryStorage();
const singleFileUpload = multer({ storage: inMemoryStorage });
const azure = require('azure-storage');
const { BlobServiceClient } = require("@azure/storage-blob");

// const getStream = require('into-stream');
class ImageService {


    uploadFileToBlob = async (file) => {

        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.CONN_STR);
        //listing containers
        // let i = 1;
        // let containers = blobServiceClient.listContainers();
        // for await (const container of containers) {
        //     console.log(`Container ${i++}: ${container.name}`);
        // }

        //Uploading
        const containerClient = blobServiceClient.getContainerClient('images');
        const blobName = "images/newblob" + new Date().getTime() + ".PNG";
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer);
        console.log("uploadBlobResponse: ",uploadBlobResponse)
        console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);

        //Listing blobs inside containers
        const container = blobServiceClient.getContainerClient('images');
        let j = 1;
        let blobs = container.listBlobsFlat();
        for await (const blob of blobs) {
            console.log(`Blob ${j++}: ${blob.name}`);
        }

        //Downloading
        // const blobClient = containerClient.getBlobClient("newblob1627557981920.png");

        // console.log("blobClient", blobClient)
        // const downloadBlockBlobResponse = await blobClient.download();
        // console.log("downloadBlockBlobResponse", downloadBlockBlobResponse)
        // const downloaded = (
        //   await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
        // ).toString();
        // console.log("Downloaded blob content:", downloaded);

        // async function streamToBuffer(readableStream) {
        //   return new Promise((resolve, reject) => {
        //     const chunks = [];
        //     readableStream.on("data", (data) => {
        //       chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        //     });
        //     readableStream.on("end", () => {
        //       resolve(Buffer.concat(chunks));
        //     });
        //     readableStream.on("error", reject);
        //   });
        // }

    };

}
module.exports = ImageService;