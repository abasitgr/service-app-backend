const Appservices = require("../service/servicesCategory.services");
const { OKSuccess } = require("../utils/success");
const { NotFoundError } = require("../utils/error");
const { getServiceCategory } = require("../utils/helper")


var appServices = new Appservices();

module.exports.AddService = async (req, res) => {
  try {
    const category = await appServices.addCategory(req);
    if (category.status === 409) {
      return res.status(category.status).send(category);
    }
    let response = new OKSuccess("Successfully Added the service", category);
    return res.status(response.status).send(response);
  }
  catch (err) {
    res.status(err.status).send(err);
  }
}

module.exports.EditService = async (req, res) => {
  try {
    const category = await appServices.updateCategoryDetails(req);
    if (category.status === 400 || category.status === 409) {
      return res.status(category.status).send(category);
    }
    const success = new OKSuccess({ message: "Service Information updated ", category });
    return res.status(success.status).send(success);
  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}

module.exports.getById = async (req, res) => {
  try {
    let { id } = req.params;
    const service = await getServiceCategory("id", id);
    if (service) {
      const success = new OKSuccess({ message: "Requested Service", service });
      return res.status(success.status).send(success);
    }
    const error = new NotFoundError({ message: "Requested service not found" });
    return res.status(error.status).send(error);

  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}

module.exports.getAll = async (req, res) => {
  try {
    const category = await appServices.getAll(req);
    console.log("category: ", category);
    let response;
    if (category.services.length)
      response = new OKSuccess("All available services", category)
    else
      response = new NotFoundError("Currently no service category available");

    return res.status(response.status).send(response);
  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}

module.exports.removeService = async (req, res) => {
  try {

    const service = await appServices.removeCategoryDetail(req);
    const success = new OKSuccess({ message: "Service Information updated ", service });
    return res.status(success.status).send(success);
  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}

module.exports.categoryStatus = async (req, res) => {
  try {

    const service = await appServices.statusCategoryDetail(req);
    const success = new OKSuccess({ message: "Service Information updated ", service });
    return res.status(success.status).send(success);
  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}

module.exports.categoryList = async (req, res) => {
  try {
    const category = await appServices.CategoryList(req);
    let response;
    if (category.length)
      response = new OKSuccess("All available services", category)
    else
      response = new NotFoundError("Currently no service category available");

    return res.status(response.status).send(response);
  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}