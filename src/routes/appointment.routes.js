const express = require("express");
const router = express.Router();
const APPOINTMENT_CONTROLLER = require("../controller/appointment.Controller");
const { authentication } = require("../utils/authentication");
const { validation } = require("../validation");


//Appointment Routes

router.post("/create", authentication, APPOINTMENT_CONTROLLER.appointment);
router.get("/delete/:id", authentication, APPOINTMENT_CONTROLLER.appointmentDelete);
router.get("/getAll", authentication, APPOINTMENT_CONTROLLER.getAll);
router.patch("/status/:id", authentication, APPOINTMENT_CONTROLLER.appointmentUpdate)


module.exports = router