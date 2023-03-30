const Service = require("../model/services.model");
const { InternalServerError, ConfictError, NotFoundError } = require("../utils/error");
const S3 = require("../utils/awsS3")
const config = require("../config/aws-config")
const { getServiceCategory, service, convertImage } = require("../utils/helper")
const { Pagination } = require("../utils/pagination");
const imageUpload = require("../utils/azureImageUpload");

class Services {
    async addService(req) {
        const { body } = req;
        const { name, category } = body;
        try {
            console.log("body", body)

            const found = await getServiceCategory("id", category);


            if (!found) {
                throw new NotFoundError({ message: `Category is not available by this id: ${category}` });
            }
            // const isServiceAlreadyExist = await service("name", name);
            const isServiceAlreadyExist = await Service.find({ name: name, isDelete: false, category: category }).populate("service", "serviceName baseCharges chargesType bookingType");


            if (isServiceAlreadyExist.length) {
                throw new ConfictError({ message: `Service with name ${name} already exist` });
            }
            const data = new Service(body);
            // console.log("data:", data.id);
            data.createdBy = req.user;
            await data.save();
            if (req.file) {
                let fileName = data.id;
                let extension = ".png";
                let path = "service";
                let buffer = req.file.buffer;
                const location = await imageUpload.uploadFile(buffer, fileName, path, extension)
                let imageLocation = {
                    location: location,
                    lastUpdatedAt: new Date()
                }
                // const location = await S3.uploadFile(
                //     req.file.buffer,
                //     `${data.id}.${extension}`,
                //     `${config.S3.ServiceFolder}/${data.category}/${config.S3.MainServiceFolder}/${data.id}`
                // );
                data.imagePath(imageLocation);
            }
            return (data);
        }
        catch (err) {
            if (err.status === 409 || err.status === 404)
                return err;
            else
                throw new InternalServerError({ message: 'Error in adding service', data: err })
        }
    }



    async updateServiceDetails(req) {
        // console.log("AAAA", req.file)
        const { body } = req;
        const { id } = req.params;
        const { category, name } = body;
        if (!category) {
            throw new NotFoundError({ message: `Category must be required` });
        }
        // const isServiceAlreadyExist = await service("name", name);
        const isServiceAlreadyExist = await Service.find({ name: name, isDelete: false, category: category }).populate("service", "serviceName baseCharges chargesType bookingType");


        if (isServiceAlreadyExist.length && isServiceAlreadyExist[0].id !== id) {
            throw new ConfictError({ message: `Service with name ${name} already exist` });
        }
        try {
            const found = await getServiceCategory("id", category);

            if (!found) {
                throw new NotFoundError({ message: `Category is not available by this id: ${category}` });
            }
            const service = await Service.findOneAndUpdate({ id }, { $set: body }, { new: true });
            //service will be null if the id will not going to match
            if (!service) {

                throw new NotFoundError({ message: "Service does not exist" });
            }
            console.log("service", service.id)
            service.updatedBy = req.user;
            await service.save();
            if (req.file) {
                let fileName = service.id;
                let extension = ".png";
                let path = "service";
                let buffer = req.file.buffer;
                const location = await imageUpload.uploadFile(buffer, fileName, path, extension)
                let imageLocation = {
                    location: location,
                    lastUpdatedAt: new Date()
                }
                // const location = await S3.uploadFile(
                //     req.file.buffer,
                //     `${service.id}.${extension}`,
                //     `${config.S3.ServiceFolder}/${service.category}/${config.S3.MainServiceFolder}/${service.id}`
                // );
                service.imagePath(imageLocation);
            }
            return service;
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else
                throw new InternalServerError({ message: 'error in editing', data: err })
        }
    }

    async getAll(data) {
        try {
            let mysort = { createdAt: -1 };
            let skip = data.query.skip;
            let perPage = data.query.page;
            let _search =
                data.query.search == undefined || "" ? "" : data.query.search.trim();
            const services = await Service.find({
                $or: [
                    {
                        name: { $regex: ".*" + _search + ".*" },
                        isDelete: false,
                    }
                ],
            }).populate("services", "serviceName baseCharges")
                .populate("adminCreate", "name email phoneNumber")
                .populate("adminUpdate", "name email phoneNumber")
                .sort(mysort).limit(parseInt(perPage))
                .skip(parseInt(_search ? 0 : skip * parseInt(perPage)));
            if (services.length >= 1) {

                const count = await Service.countDocuments({
                    $or: [
                        {
                            name: { $regex: ".*" + _search + ".*" },
                            isDelete: false,

                        },
                    ],
                });

                let pagination = await Pagination(count, perPage, skip)
                return { services, pagination };
            } else {
                return { services };
            }
        }
        catch (err) {
            throw new InternalServerError(err);
        }
    }












    async categoryID(data) {
        try {
            const { id } = data.params;
            let mysort = { createdAt: -1 };
            let skip = data.query.skip;
            let perPage = data.query.page;
            let _search =
                data.query.search == undefined || "" ? "" : data.query.search.trim();
            let services = await Service.find({
                $or: [
                    {
                        name: { $regex: ".*" + _search + ".*" },
                        isDelete: false,
                        category: id
                    }
                ],
            }).populate("services", "serviceName baseCharges")
                .sort(mysort).limit(parseInt(perPage))
                .skip(parseInt(_search ? 0 : skip * parseInt(perPage)));
            if (services.length >= 1) {
                services.map(async obj => {
                    // Returns the object where
                    // console.log("obj", obj)
                    // the given property has some value 
                    return obj['image']['url'] = await convertImage(obj.image)
                })






                //     url = await convertImage(supplier.profilePicture)
                const count = await Service.countDocuments({
                    $or: [
                        {
                            name: { $regex: ".*" + _search + ".*" },
                            isDelete: false,
                            category: id

                        },
                    ],
                });

                let pagination = await Pagination(count, perPage, skip)
                return { services, pagination };
            } else {
                return { services };
            }
        }
        catch (err) {
            throw new InternalServerError(err);
        }
    }









    async serviceDetail(req, value) {
        const { id } = req.params;
        const data = await service("id", id);
        console.log("238 Data: ", data)
        if (!data.length) {
            throw new NotFoundError({ message: `Service is not available by this id: ${id}` });
        }
        data[0][value] = !data[0][value]
        data[0].updatedBy = req.user;
        await data[0].save();
        return data[0];
    }
}

module.exports = Services;