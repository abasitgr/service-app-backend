const express = require("express");
const router = express.Router();
const WALLET_CONTROLLER = require("../controller/wallet.Controller");
const { authentication } = require("../utils/authentication");


router.post("/deposit/:id",authentication, WALLET_CONTROLLER.depositBalance);
router.post("/jobDone/:id",authentication, WALLET_CONTROLLER.jobDone);
router.get("/week/:id", authentication, WALLET_CONTROLLER.weeklySubmission);
router.get("/transaction/:id", authentication, WALLET_CONTROLLER.getDetail);
router.post("/weekSubmit/:id", authentication, WALLET_CONTROLLER.weekSubmit);
router.get("/getAll/:accountType/:id", authentication, WALLET_CONTROLLER.getAll);
router.get("/getAllSupplier", authentication, WALLET_CONTROLLER.getAllSupplier);


module.exports = router
