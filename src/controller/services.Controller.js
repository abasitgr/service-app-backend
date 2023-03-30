const Services = require("../service/services.service");
const { OKSuccess } = require("../utils/success");
const { NotFoundError } = require("../utils/error");
const { service } = require("../utils/helper")


var AppServices = new Services();

module.exports.AddService = async (req, res) => {
    try {
        const service = await AppServices.addService(req);
        console.log("service:", service);
        if (service.status === 409 || service.status === 404) {
            return res.status(service.status).send(service);
        }
        const response = new OKSuccess("Successfully Added the service", service);
        return res.status(response.status).send(response);
    }
    catch (err) {
        console.log("err: ", err);
        res.status(err.status).send(err);
    }
}

module.exports.EditService = async (req, res) => {
    try {
        const service = await AppServices.updateServiceDetails(req);
        if (service.status === 404 || service.status === 409) {
            return res.status(service.status).send(service);
        }
        const success = new OKSuccess({ message: "Service Information updated ", service });
        return res.status(success.status).send(success);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}


module.exports.getById = async (req, res) => {
    try {
        if (!req.params.id)
            return res.status(400).json({ message: "missing parameter ID" });
        let { id } = req.params;
        console.log("id", id)
        let data = await service("id", id);
        if (!data.length) {
            throw new NotFoundError({ message: `service is not available by this id: ${id}` });
        }
        const success = new OKSuccess({ message: "Requested Service", data });
        return res.status(success.status).send(success);

    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}

module.exports.getAll = async (req, res) => {
    try {
        const allServices = await AppServices.getAll(req);
        let response;
        if (allServices.services.length)
            response = new OKSuccess("All available services", allServices)
        else
            response = new NotFoundError("Currently no service available");
        return res.status(response.status).send(response);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}


module.exports.categoryID = async (req, res) => {
    try {
        const allServices = await AppServices.categoryID(req);
        let response;
        if (allServices.services.length)
            response = new OKSuccess("All available services", allServices)
        else
            response = new NotFoundError("Currently no service available");
        return res.status(response.status).send(response);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}
module.exports.removeService = async (req, res) => {
    try {

        const service = await AppServices.serviceDetail(req, 'isDelete');
        const success = new OKSuccess({ message: "Service Information updated ", service });
        return res.status(success.status).send(success);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}

module.exports.serviceStatus = async (req, res) => {
    try {

        const service = await AppServices.serviceDetail(req, 'isActive');
        const success = new OKSuccess({ message: "Service Information updated ", service });
        return res.status(success.status).send(success);
    }
    catch (err) {
        return res.status(err.status).send(err);
    }
}
