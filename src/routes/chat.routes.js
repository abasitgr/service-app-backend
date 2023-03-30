const express = require("express");
const router = express.Router();
const CHAT_CONTROLLER = require("../controller/chat.Controller");
const { authentication } = require("../utils/authentication");
const { validation } = require("../validation");


//Admin Routes
router.get("/getAll",authentication,CHAT_CONTROLLER.getAll);
router.get("/getEnd",authentication,CHAT_CONTROLLER.getEnd);
router.get("/getOne/:id",authentication,CHAT_CONTROLLER.getOne);
router.get("/getOldProblems/:roomId",authentication,CHAT_CONTROLLER.getOldProblems);
router.get("/openChats",authentication,CHAT_CONTROLLER.openChats);



module.exports = router