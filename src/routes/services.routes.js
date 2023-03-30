const express = require("express");
const router = express.Router();
const SERVICES_CONTROLLER = require("../controller/services.Controller");
const { authentication } = require("../utils/authentication");
const { validation } = require("../validation");
const {fileUploader} = require("../utils/helper")



router.post("/add", authentication, fileUploader.single('image'), validation.servicesValidation, SERVICES_CONTROLLER.AddService);
router.patch("/edit/:id", authentication, fileUploader.single('image'), validation.servicesValidation, SERVICES_CONTROLLER.EditService);
router.get("/get/:id", authentication, SERVICES_CONTROLLER.getById);
router.get("/getAll", authentication, SERVICES_CONTROLLER.getAll);
router.get("/categoryID/:id", authentication, SERVICES_CONTROLLER.categoryID);
router.get("/delete/:id", authentication, SERVICES_CONTROLLER.removeService);
router.get("/status/:id", authentication, SERVICES_CONTROLLER.serviceStatus);

module.exports = router;