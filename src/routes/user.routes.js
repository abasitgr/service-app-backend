const express = require("express");
const router = express.Router();
const { validation } = require("../validation");
const CONSUMER_CONTROLLER = require("../controller/consumers.Controller");
const { authentication } = require("../utils/authentication");
const { fileUploader } = require("../utils/helper");

router.post("/registration", validation.consumerValidation, CONSUMER_CONTROLLER.Registration);

router.get('/getAll', authentication, CONSUMER_CONTROLLER.getAll)
router.get('/get', authentication, CONSUMER_CONTROLLER.userProfile)
router.get('/get/:id', authentication, CONSUMER_CONTROLLER.getOne)
router.patch('/edit', authentication, fileUploader.single("profilePicture"), validation.consumerValidation, CONSUMER_CONTROLLER.editUser);
router.get("/delete/:id", authentication, CONSUMER_CONTROLLER.removeUser);
router.get("/status/:id", authentication, CONSUMER_CONTROLLER.userStatus);




router.post("/login", CONSUMER_CONTROLLER.sendOTPToUser);
router.post("/verified", CONSUMER_CONTROLLER.OTPVerification);



module.exports = router;

