const express = require("express");
const router = express.Router();
const { validation } = require("../validation");
const SUPPLIER_CONTROLLER = require("../controller/supplier.Controller");
const { authentication } = require("../utils/authentication");
const { fileUploader } = require("../utils/helper");

router.post("/registration", validation.supplierValidation, SUPPLIER_CONTROLLER.Registration);

router.get('/getAll', authentication, SUPPLIER_CONTROLLER.getAll)
router.get('/get', authentication, SUPPLIER_CONTROLLER.supplierProfile)
router.get('/get/:id', authentication, SUPPLIER_CONTROLLER.getOne)
router.patch('/edit', authentication, fileUploader.single("profilePicture"), validation.supplierValidation, SUPPLIER_CONTROLLER.editUser);
router.get("/delete/:id", authentication, SUPPLIER_CONTROLLER.removesupplier);
router.get("/status/:id", authentication, SUPPLIER_CONTROLLER.supplierStatus);
router.get("/online", authentication, SUPPLIER_CONTROLLER.supplierOnline);


router.patch('/verify/:id', fileUploader.fields([
    {
        name: 'nic_front', maxCount: 1
    }, {
        name: 'nic_back', maxCount: 1
    }, {
        name: 'character_certificate', maxCount: 1
    }

]), authentication, SUPPLIER_CONTROLLER.supplierVerify);

router.patch('/add/witness/:id', fileUploader.fields([
    {
        name: 'nic_front', maxCount: 1
    }, {
        name: 'nic_back', maxCount: 1
    },

]), authentication, SUPPLIER_CONTROLLER.supplierWitness);

router.patch('/verification/status/:id', authentication, SUPPLIER_CONTROLLER.verification);

router.patch('/add/services/:id', authentication, SUPPLIER_CONTROLLER.supplierService);
router.get('/:id/services/:serviceID', authentication, SUPPLIER_CONTROLLER.removeSupplierService);
router.get('/:id/witness/:witnessID', authentication, SUPPLIER_CONTROLLER.removeWitness);


router.post("/login", SUPPLIER_CONTROLLER.sendOTPToUser);
router.post("/verified", SUPPLIER_CONTROLLER.OTPVerification);

router.get("/pdf/:id", SUPPLIER_CONTROLLER.supplierGeneratePDF);
// router.post("/appointment/:id", SUPPLIER_CONTROLLER.appointment)

module.exports = router;

