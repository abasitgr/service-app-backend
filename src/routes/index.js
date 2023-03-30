const userRoutes = require("./user.routes");
const adminRoutes = require("./admin.routes");
const serviceCategory = require("./servicesCategory.routes");
const services = require("./services.routes");
const supplier = require("./supplier.routes");

const wallet = require("./wallet.routes");
const job = require("./jobs.routes");
const chat = require("./chat.routes");



const appointment = require("./appointment.routes");
const notification = require("./notification.routes");

module.exports = {
    userRoutes,
    adminRoutes,
    serviceCategory,
    services,
    supplier,
    wallet,
    job,
    appointment,
    chat,
    notification
}