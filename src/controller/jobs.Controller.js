const Job = require('../model/jobs.model')
const User = require('../model/user.model')
const Service = require('../model/services.model')
const WalletService = require("../service/wallet.service");
const servicesCategory = require('../model/servicesCategory.model')
const Supplier = require('../model/supplier.model')
const JobService = require('../service/job.service')
const { OKSuccess } = require('../utils/success')
const {
  NotFoundError,
  InternalServerError,
  UnauthorizedError
} = require('../utils/error')
const { jobStatus } = require('../enums')
const { response } = require('express')

const NotificationService = require('../service/notification.service');

module.exports.createJob = async (req, res) => {
  try {
    const { body } = req
    const { user, charges } = body
    const { userId } = user
    const { serviceCharge } = charges

    let response

    let isUserExist = await User.findOne({ id: userId, isDelete: false })
    let isServiceExist = await Service.findOne({
      id: serviceCharge[0].id,
      isDelete: false
    })

    if (!isUserExist) {
      response = new NotFoundError('No User Found', isUserExist)
      res.status(response.status).send(response)
    }

    // if (!isServiceExist) {
    //   response = new NotFoundError('No Service Found', isServiceExist)
    //   res.status(response.status).send(response)
    // }

    if (!isServiceExist) {
      isServiceExist = await servicesCategory.findOne({
        id: serviceCharge[0].id,
        isDelete: false
      })
      if (!isServiceExist) {
        response = new NotFoundError('No Service Found', isServiceExist)
        res.status(response.status).send(response)
      }
    }

    const data = await new JobService().createJob(
      body,
      isUserExist,
      isServiceExist
    )

    response = data


    if (response.status === 200) {
      const supplierList = await new JobService().findSuppliers(data.data, isUserExist)
      console.log("supplier",supplierList)
      await new NotificationService().createJobNotification(isUserExist, isServiceExist, data.data, supplierList);
      response['supplierData'] = supplierList;
      console.log("response",response)
    }
    res.status(response.status).send(response)
  } catch (err) {
    console.log("error: ",err)
    if (err.messageText.status === 404) {
      console.log("error:", err)
      await new NotificationService().declinedJobNotification(err.messageText.data.id, err.messageText.data.fcmToken, err.messageText.data.jobId);
    }
    res.status(err.status).send(err)
  }
}

module.exports.acceptJob = async (req, res) => {
  try {
    const { body } = req
    const { supplier } = body
    const { supplierId } = supplier
    const { jobId } = req.params
    let response

    let isSupplierExist = await Supplier.findOne({
      id: supplierId,
      isDelete: false
    })

    if (!isSupplierExist) {
      response = new NotFoundError('No Supplier Found', isSupplierExist)
      res.status(response.status).send(response)
    }

    const data = await new JobService().acceptJob(
      jobId,
      supplier,
      isSupplierExist.name
    )

    response = data
    await new NotificationService().acceptJobNotification(data.data[0].users[0], data.data[0].services[0], data.data[0].id, data.data[0].suppliers[0]);
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.cancelJob = async (req, res) => {
  try {
    const { jobId, accountType } = req.params
    let response


    const data = await new JobService().cancelJob(jobId, accountType)
    if (accountType === "consumer") {
      if (data.data[0].suppliers) {
        await new NotificationService().consumerCancelNotification(data.data[0].suppliers[0], data.data[0].services[0], data.data[0].id);
      }
    }
    if (accountType === "supplier") {
      await new NotificationService().supplierCancelNotification(data.data[0].users[0], data.data[0].services[0], data.data[0].id);
    }

    const walletService = await new WalletService().jobCancel(data.data[0]);
    response = data
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.arrivedJob = async (req, res) => {
  try {
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      status: jobStatus.ACCEPT
    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    const data = await new JobService().arrivedJob(isJobExist)
    await new NotificationService().supplierArrivedNotification(data.data[0].users[0], data.data[0].id, data.data[0].suppliers[0]);
    response = data
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.getById = async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(400).json({ message: 'missing parameter ID' })
    let { id } = req.params
    console.log('id', id)
    let isJobExist = await Job.findOne({
      id: id
    })
      .populate('users', 'name email phoneNumber fcmToken balance profilePicture')
      .populate('suppliers', 'name email phoneNumber fcmToken balance profilePicture')
      .populate("charges.serviceCharge.service", "name bookingType chargesType category image")
      .populate("charges.serviceCharge.category", "serviceName bookingType chargesType category image")
      // .lean()
    // .populate('services', 'name bookingType chargesType category image')
    // .populate('services', 'name bookingType chargesType category image')

    if (!isJobExist) {
      let response = new NotFoundError('No Job Found', isJobExist)
      return res.status(response.status).send(response)
    }

    let success = new OKSuccess({ message: 'Requested Job', isJobExist })


    if (isJobExist.status === "completed") {
      const walletDetail = await new WalletService().getTransaction(id);
      
      if (walletDetail[0].data[0]) {
        // isJobExist.walletDetail = walletDetail
        let obj = Object.assign({},isJobExist.toJSON());
        obj['walletDetail'] = walletDetail[0].data[0]
        isJobExist = obj
        success = new OKSuccess({ message: 'Requested Job', isJobExist })
      }
    }


    return res.status(success.status).send(success)
  } catch (err) {
    return res.status(err.status).send(err)
  }
}

module.exports.getAll = async (req, res) => {
  try {
    const allJobs = await new JobService().getAll(req.query)
    console.log("sss", allJobs)
    let response;
    if (allJobs.jobs[0].data.length) {
      response = new OKSuccess("Successfully Retrive the jobs", allJobs);
    }
    else {
      response = new NotFoundError({ msg: "No jobs in the database" });
    }

    return res.status(response.status).send(response);
  } catch (err) {
    return res.status(err.status).send(err)
  }
}

module.exports.verifyCode = async (req, res) => {
  try {
    const { body } = req
    const { verificationCode } = body
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      status: jobStatus.ARRIVED
    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    response = await new JobService().verifyCode(isJobExist, verificationCode)
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.addService = async (req, res) => {
  try {
    const { body } = req
    const { serviceId } = body
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      $or: [
        { status: jobStatus.IN_PROGRESS },
        { status: jobStatus.PENDING }
      ]

    })

    let isServiceExist = await Service.findOne({
      id: serviceId,
      isDelete: false
    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    if (!isServiceExist) {
      isServiceExist = await servicesCategory.findOne({
        id: serviceId,
        isDelete: false
      })
      if (!isServiceExist) {
        response = new NotFoundError('No Service Found', isServiceExist)
        res.status(response.status).send(response)
      }
    }

    response = await new JobService().addService(isJobExist, isServiceExist)
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.addEquipmentCharges = async (req, res) => {
  try {
    const { body } = req
    const { equipmentCharge } = body
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      $or: [
        { status: jobStatus.IN_PROGRESS }
      ]

    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    response = await new JobService().addEquipmentCharges(isJobExist, equipmentCharge)
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}


module.exports.pauseJob = async (req, res) => {
  try {
    const { body } = req
    const { serviceId } = body
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      $or: [
        { status: jobStatus.IN_PROGRESS },
        { status: jobStatus.PENDING }
      ]
    })

    let isServiceExist = await Service.findOne({
      id: serviceId,
      isDelete: false
    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    if (!isServiceExist) {
      isServiceExist = await servicesCategory.findOne({
        id: serviceId,
        isDelete: false
      })
      if (!isServiceExist) {
        response = new NotFoundError('No Service Found', isServiceExist)
        res.status(response.status).send(response)
      }
    }

    response = await new JobService().pauseJob(isJobExist, serviceId)
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.restartJob = async (req, res) => {
  try {
    const { body } = req
    const { serviceId } = body
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      $or: [
        { status: jobStatus.IN_PROGRESS },
        { status: jobStatus.PENDING }
      ]
    })

    let isServiceExist = await Service.findOne({
      id: serviceId,
      isDelete: false
    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    if (!isServiceExist) {
      isServiceExist = await servicesCategory.findOne({
        id: serviceId,
        isDelete: false
      })
      if (!isServiceExist) {
        response = new NotFoundError('No Service Found', isServiceExist)
        res.status(response.status).send(response)
      }
    }

    response = await new JobService().restartJob(isJobExist, serviceId)
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.endJob = async (req, res) => {
  try {
    const { body } = req
    const { serviceId } = body
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      $or: [
        { status: jobStatus.IN_PROGRESS },
        { status: jobStatus.PENDING }
      ]
    })

    let isServiceExist = await Service.findOne({
      id: serviceId,
      isDelete: false
    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    if (!isServiceExist) {
      isServiceExist = await servicesCategory.findOne({
        id: serviceId,
        isDelete: false
      })
      if (!isServiceExist) {
        response = new NotFoundError('No Service Found', isServiceExist)
        res.status(response.status).send(response)
      }
    }

    response = await new JobService().endJob(isJobExist, serviceId)
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.completeJob = async (req, res) => {
  try {
    const { jobId } = req.params
    let response

    let isJobExist = await Job.findOne({
      id: jobId,
      $or: [
        { status: jobStatus.IN_PROGRESS },
        { status: jobStatus.PENDING },
      ]
    })

    if (!isJobExist) {
      response = new NotFoundError('No Job Found', isJobExist)
      res.status(response.status).send(response)
    }

    response = await new JobService().completeJob(isJobExist)
    await new NotificationService().completedJobNotification(response.data[0].users[0], response.data[0].services[0], response.data[0].id, response.data[0].suppliers[0]);
    res.status(response.status).send(response)
  } catch (err) {
    console.log(err)
    res.status(err.status).send(err)
  }
}

module.exports.feedback = async (req, res) => {
  try {
    const { accountType, jobId } = req.params
    const jobExist = await new JobService().getOneJob(jobId);
    if (jobExist.status === 500) {
      res.status(jobExist.status).send(jobExist)
    }
    const reviewRating = await new JobService().reviewRating(accountType, jobExist.data, req.body);
    res.status(reviewRating.status).send(reviewRating)
  } catch (err) {
    res.status(err.status).send(err)
  }
}
module.exports.getUserJobs = async (req, res) => {
  try {
    const { accountType, id } = req.params;
    const { status } = req.query;
    let isUser, response, job;
    if (accountType === "consumer") {
      isUser = await User.findOne({ id: id, isDelete: false })
    }
    if (accountType === "supplier") {
      isUser = await Supplier.findOne({ id: id, isDelete: false })
    }
    if (!isUser) {
      response = new NotFoundError(`No User found by this id: ${id}`);
      res.status(response.status).send(response)
    }

    let result = await new JobService().getUserJobs(req.params, req.query);
    res.status(result.status).send(result)
  } catch (err) {
    res.status(err.status).send(err)
  }
}

module.exports.getJobs = async (req, res) => {
  try {
    const { accountType } = req.params;
    const id = req.user;
    const { status } = req.query;
    let isUser;
    let response;
    if (accountType === "consumer") {
      isUser = await User.findOne({ id: id, isDelete: false })
    }
    if (accountType === "supplier") {
      isUser = await Supplier.findOne({ id: id, isDelete: false })
    }

    if (!isUser) {
      response = new NotFoundError(`No User found by this id: ${id}`);
    }

    response = await new JobService().getJobs(isUser, status)
    res.status(response.status).send(response)
  } catch (err) {
    res.status(err.status).send(err)
  }
}
