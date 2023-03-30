const Appointment = require("../model/appointment.model")
const { ConfictError, InternalServerError, UnauthorizedError, NotFoundError } = require("../utils/error");
const moment = require('moment-timezone');

class AppointmentService {
    constructor() {

    }

    async supplierAppointment({ body, req }) {
        console.log("body", body)
        let supplier;
        const { user, appointmentStartTime } = body;
        const getAllAppointments = await Appointment.find({ isDelete: false });

        var count = 0;
        getAllAppointments.find(f => {
            if (f.appointmentStartTime === appointmentStartTime) {
                count++;
            }
        })
        if (count >= 3) {
            throw new InternalServerError({ message: `Cannot add more appointments in same slot` });
        }

        const checkSupplier = await Appointment.find({ user: user, isDelete: false })
        if (checkSupplier.length > 0) {
            let todayDate = new Date();
            let bodyDate = moment(todayDate).format("YYYY-MM-DD");
            let supplierDate = moment(checkSupplier[checkSupplier.length - 1].appointmentStartTime).format("YYYY-MM-DD");

            if (bodyDate > supplierDate) {
                supplier = new Appointment(body)
                supplier.appointed = supplier.appointed.concat({ assignedBy: req.user });
                const saveAppointment = await supplier.save();

                return saveAppointment;
            } else {
                throw new ConfictError({ message: `Supplier cannot be appointed again` });
            }
        }

        supplier = new Appointment(body)
        supplier.appointed = supplier.appointed.concat({ assignedBy: req.user });
        const saveAppointment = await supplier.save();
        return saveAppointment;
    }

    async appointmentDelete(id) {
        const checkAppt = await Appointment.findOne({ id: id, isDelete: false })
        if (!checkAppt) {
            throw new NotFoundError({ message: `Appointment is not available by this id: ${id}` });
        }
        checkAppt.isDelete = true;
        checkAppt.save();
        return checkAppt;
    }

    async appointmentStatus(id, body) {
        const checkAppt = await Appointment.findOne({ id: id, isDelete: false })
        if (!checkAppt) {
            throw new NotFoundError({ message: `Appointment is not available by this id: ${id}` });
        }
        checkAppt.status = body;
        await checkAppt.save();
        return checkAppt;
    }

    static async getAll(body) {

        let startDate = body.query.startDate;
        let endDate = body.query.endDate;
        const appointments = await Appointment.find(
            {
                appointmentStartTime: { $gte: startDate, $lte: endDate },
                isDelete: false,
            }
        );
        return appointments;

    }
}
module.exports = AppointmentService;