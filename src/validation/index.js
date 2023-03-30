const { consumerValidation } = require("./user.validation");
const { serviceCategoryValidation } = require("./serviceCategory.validation");
const { adminValidation } = require("./admin.validation");
const { servicesValidation } = require("./services.validation");
const { supplierValidation } = require("./supplier.validation");
const { appointmentValidaiton } = require("./appointment.validation");
module.exports.validation = {
    consumerValidation,
    serviceCategoryValidation,
    adminValidation,
    servicesValidation,
    supplierValidation,
    appointmentValidaiton
}
