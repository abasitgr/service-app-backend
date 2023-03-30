const express = require("express");
const router = express.Router();
const NOTIFICATION = require("../controller/notification.Controller");
const { authentication } = require("../utils/authentication");
const { validation } = require("../validation");



router.post("/", authentication, NOTIFICATION.notify);
router.get("/getAll", authentication, NOTIFICATION.getAll);
router.get("/getAllJobNotifications", authentication, NOTIFICATION.getAllJobNotifications);
router.post("/read/:id", authentication, NOTIFICATION.read)


module.exports = router