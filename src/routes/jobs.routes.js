const express = require("express");
const router = express.Router();
const JOB_CONTROLLER = require("../controller/jobs.Controller");
const { authentication } = require("../utils/authentication");

router.post("/add", authentication, JOB_CONTROLLER.createJob);
router.post("/accept/:jobId", authentication, JOB_CONTROLLER.acceptJob);
router.patch("/cancel/:jobId/:accountType", authentication, JOB_CONTROLLER.cancelJob);
router.post("/pause/:jobId", authentication, JOB_CONTROLLER.pauseJob);
router.post("/arrived/:jobId", authentication, JOB_CONTROLLER.arrivedJob);
router.post("/restart/:jobId", authentication, JOB_CONTROLLER.restartJob);
router.post("/end/:jobId", authentication, JOB_CONTROLLER.endJob);
router.post("/complete/:jobId", authentication, JOB_CONTROLLER.completeJob);
router.get("/get/:id", authentication, JOB_CONTROLLER.getById);
router.get("/getAll", authentication, JOB_CONTROLLER.getAll);
router.post("/verifyCode/:jobId", authentication, JOB_CONTROLLER.verifyCode);
router.post("/addService/:jobId", authentication, JOB_CONTROLLER.addService);
router.post("/addEquipmentCharges/:jobId", authentication, JOB_CONTROLLER.addEquipmentCharges);
router.get("/getUserJobs/:accountType/:id", authentication, JOB_CONTROLLER.getUserJobs); //for admin panel
router.post("/feedback/:accountType/:jobId", authentication, JOB_CONTROLLER.feedback)
// router.get("/feedback/delete/:accountType/:jobId/:id", authentication, JOB_CONTROLLER.feedbackDelete)

module.exports = router;