const express = require("express");
const router = express.Router();
const SERVICE_CATEGORY_CONTROLLER = require("../controller/servicesCategory.Controller");
const { authentication } = require("../utils/authentication");
const { validation } = require("../validation");
const { fileUploader } = require("../utils/helper")


router.post("/add", authentication, fileUploader.single('image'), validation.serviceCategoryValidation, SERVICE_CATEGORY_CONTROLLER.AddService);
router.patch("/edit/:id", authentication, fileUploader.single('image'), validation.serviceCategoryValidation, SERVICE_CATEGORY_CONTROLLER.EditService);
router.get("/get/:id", authentication, SERVICE_CATEGORY_CONTROLLER.getById);
router.get("/", authentication, SERVICE_CATEGORY_CONTROLLER.getAll);
router.get("/delete/:id", authentication, SERVICE_CATEGORY_CONTROLLER.removeService);
router.get("/status/:id", authentication, SERVICE_CATEGORY_CONTROLLER.categoryStatus);
router.get("/dropDownList", authentication, SERVICE_CATEGORY_CONTROLLER.categoryList);


module.exports = router;