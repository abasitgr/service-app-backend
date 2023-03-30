const express = require("express");
const router = express.Router();
const ADMIN_CONTROLLER = require("../controller/admin.Controller");
const { authentication } = require("../utils/authentication");
const { validation } = require("../validation");


//Admin Routes
router.post("/login", ADMIN_CONTROLLER.AdminLogin);
router.post("/", authentication ,validation.adminValidation, ADMIN_CONTROLLER.AddAdmin);
router.patch("/edit/:id", authentication, validation.adminValidation, ADMIN_CONTROLLER.EditAdminInfo);
router.get("/:id", authentication, ADMIN_CONTROLLER.getById);
router.get("/", authentication, ADMIN_CONTROLLER.getAll);

module.exports = router