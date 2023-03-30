const SupplierService = require("../service/supplier.service");
const AppointmentService = require("../service/appointment.service");
const { OKSuccess } = require("../utils/success");
const EmailService = require("../service/email.service");


module.exports.appointment = async (req, res) => {
    try {
        const { body } = req;
        const supplierRecord = await new SupplierService().getSupplierDetail(body.user);
        const supplierAppointment = await new AppointmentService().supplierAppointment({ body, req });
        if (supplierAppointment) {
            const emailService = await new EmailService().sendEmailInvite(supplierAppointment, supplierRecord, "appointmentCreated", "add");
        }
        const success = new OKSuccess({ message: "Appointment created successfully.", supplierAppointment });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

module.exports.appointmentDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierAppointment = await new AppointmentService().appointmentDelete(id);
        const supplierRecord = await new SupplierService().getSupplierDetail(supplierAppointment.user);
        if (supplierAppointment && supplierRecord) {
            const emailService = await new EmailService().sendEmailInvite(supplierAppointment, supplierRecord, "canceledAppointment", "delete");
        }
        const success = new OKSuccess({ message: "Appointment deleted successfully.", supplierAppointment });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }

}

module.exports.appointmentUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const supplierAppointment = await new AppointmentService().appointmentStatus(id, body.status);
        const success = new OKSuccess({ message: "Appointment updated successfully. ", supplierAppointment });
        return res.status(success.status).send(success);
    }
    catch (err) {
        res.status(401).send(err);
    }
}

module.exports.getAll = async (req, res) => {
    try {
        let supplierAppointment = await AppointmentService.getAll(req)
        const success = new OKSuccess({ message: "Appointment Details", supplierAppointment });
        return res.status(success.status).send(success);
    }
    catch (err) {
        console.log("err 54", err)
        res.status(401).send(err);
    }

}