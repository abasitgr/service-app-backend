const ServiceCategory = require("../model/servicesCategory.model");
const { InternalServerError, ConfictError, BadRequestError, NotFoundError } = require("../utils/error");
const S3 = require("../utils/awsS3")
const config = require("../config/aws-config")
const { getServiceCategory, service, convertImage } = require("../utils/helper")
const { Pagination } = require("../utils/pagination");
const imageUpload = require("../utils/azureImageUpload");


class AppServices {
  async addCategory(req) {

    const { body } = req
    const { serviceName } = body;
    try {
      const isServiceAlreadyExist = await getServiceCategory("serviceName", serviceName);
      if (isServiceAlreadyExist) {
        throw new ConfictError({ message: `Service with name ${serviceName} already exist` });
      }
      const service = new ServiceCategory(body);
      service.createdBy = req.user;
      await service.save();
      if (req.file) {
        let fileName = service.id;
        let extension = ".png";
        let path = "category";
        let buffer = req.file.buffer;

        const location = await imageUpload.uploadFile(buffer, fileName, path, extension)
        let imageLocation = {
          location: location,
          lastUpdatedAt: new Date()
        }
        service.imagePath(imageLocation);

        // const location = await S3.uploadFile(
        //   req.file.buffer,
        //   `${service.id}.${extension}`,
        //   `${config.S3.ServiceFolder}/${service.id}`
        // );
        // service.imagePath(location);
      }
      return (service);
    }
    catch (err) {

      if (err.status === 409)
        return err;
      else
        throw new InternalServerError({ message: 'Error in adding service', data: err })
    }
  }

  async updateCategoryDetails(req) {
    const { body } = req;
    const { id } = req.params;
    const { serviceName } = body

    try {
      const isServiceAlreadyExist = await getServiceCategory("serviceName", serviceName);
      if (isServiceAlreadyExist && isServiceAlreadyExist.id !== id) {
        throw new ConfictError({ message: `Service with name ${serviceName} already exist` });
      }
      const service = await ServiceCategory.findOneAndUpdate({ id }, { $set: body }, { new: true });
      //service will be null if the id will not going to match
      if (!service) {

        throw new BadRequestError({ message: "Service does not exist by this id: " + id });
      }
      service.updatedBy = req.user;
      await service.save();
      if (req.file) {
        let fileName = service.id;
        let extension = ".png";
        let path = "service";
        let buffer = req.file.buffer;

        // const location = await S3.uploadFile(
        //   req.file.buffer,
        //   `${service.id}.${extension}`,
        //   `${config.S3.ServiceFolder}/${service.id}`
        // );
        const location = await imageUpload.uploadFile(buffer, fileName, path, extension)
        let imageLocation = {
          location: location,
          lastUpdatedAt: new Date()
        }
        service.imagePath(imageLocation);
      }
      return service;
    }
    catch (err) {
      if (err.status === 400 || err.status === 409)
        return err;
      else
        throw new InternalServerError({ message: 'error in editing', data: err })
    }
  }

  async getAll(data) {
    try {
      var mysort = { createdAt: -1 };
      let skip = data.query.skip;

      let perPage = data.query.page;

      var _search =
        data.query.search == undefined || "" ? "" : data.query.search.trim();
      const services = await ServiceCategory.find({
        $or: [
          {
            serviceName: { $regex: ".*" + _search + ".*" },
            isDelete: false,
          }
        ],
      }).populate("adminCreate", "name email phoneNumber")
        .populate("adminUpdate", "name email phoneNumber")
        .populate("serviceCategory", "name isActive isDelete description image category id baseCharges").sort(mysort).limit(parseInt(perPage))
        .skip(parseInt(_search ? 0 : skip * parseInt(perPage)));
      if (services.length >= 1) {
        services.map(async obj => {
          // Returns the object where
          // console.log("obj", obj)
          // the given property has some value 
          return obj['image']['url'] = await convertImage(obj.image)
        })

        const count = await ServiceCategory.countDocuments({
          $or: [
            {
              serviceName: { $regex: ".*" + _search + ".*" },
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
  async removeCategoryDetail(req) {
    const { id } = req.params;
    const category = await getServiceCategory("id", id);
    if (!category) {
      throw new NotFoundError({ message: `Service Category is not available by this id: ${id}` });
    }
    const getService = await service("category", id);
    if (getService.length) {
      throw new ConfictError({ message: `First remove sub Category` });
    }
    category.isDelete = !category.isDelete
    category.isActive = !category.isActive
    category.updatedBy = req.user;
    console.log("161: ", category);
    await category.save();
    return category;
  }

  async statusCategoryDetail(req) {
    const { id } = req.params;
    const category = await getServiceCategory("id", id);
    if (!category) {
      throw new NotFoundError({ message: `Service Category is not available by this id: ${id}` });
    }
    category.isActive = !category.isActive
    category.updatedBy = req.user;
    await category.save();
    return category;
  }

  async CategoryList() {
    console.log("177")
    try {
      var mysort = { createdAt: -1 };
      const services = await ServiceCategory.find({
        isDelete: false,
      }, { serviceName: 1, baseCharges: 1, isActive: 1, id: 1, bookingType: 1, chargesType: 1 }).sort(mysort)
      console.log("service: ", service);
      return services;

    }
    catch (err) {
      throw new InternalServerError(err);
    }
  }
}






module.exports = AppServices;