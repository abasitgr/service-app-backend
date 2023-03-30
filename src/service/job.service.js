const Job = require('../model/jobs.model')
const Supplier = require('../model/supplier.model')
const Service = require('../model/services.model')
const ServicesCategory = require('../model/servicesCategory.model')
const User = require('../model/user.model')
const { Pagination } = require('../utils/pagination')
const { PenaltyCharges, BaseCharges } = require('../constants')

const EmailService = require("../service/email.service");

const { jobStatus, bookingType, chargesType, serviceStatus } = require('../enums')
const {
  ConfictError,
  InternalServerError,
  UnauthorizedError,
  NotFoundError
} = require('../utils/error')
const { OKSuccess } = require('../utils/success')
const moment = require('moment-timezone')

class JobService {
  constructor() { }

  async validateAdvanceBooking(date) {
    try {
      let convertedDate = moment(date)
      let todayDate = moment()

      let daysDiff = convertedDate.diff(todayDate, 'days')
      if (daysDiff > 0 && daysDiff < 3) {
        console.log('daysDiff', daysDiff)
        return true
      }

      if (daysDiff === 0) {
        let hoursDiff = convertedDate.diff(todayDate, 'hours')
        console.log('hoursDiff', hoursDiff)

        if (hoursDiff >= 2) {
          return true
        } else {
          return false
        }
      }
      else {
        return false;
      }

    } catch (err) {
      return err
    }
  }

  async createJob(body, userData, serviceData) {
    try {
      if (serviceData.bookingType === bookingType.ADVANCE) {
        var isValid = await this.validateAdvanceBooking(body.bookingTime)
        if (!isValid) {
          throw new InternalServerError('Invalid Booking Date')
        }
      }

      let job = new Job(body)
      const saveJob = await job.save()
      return new OKSuccess('Job added Successfully!', saveJob)
    } catch (err) {
      console.log(err)
      throw new InternalServerError(err)
    }
  }

  async findSuppliers(jobData, userData) {
    try {
      const { charges, bookingTime } = jobData
      const { serviceCharge } = charges
      let suppliers = await Supplier.find(
        {
          'services.service': serviceCharge[0].id,
          isActive: true,
          isDelete: false,
          isOnline: true
        },
        { id: 1, name: 1, email: 1, phoneNumber: 1, balance: 1, fcmToken: 1 }
      )

      if (suppliers.length > 0) {
        var minus = moment(bookingTime).subtract('30', 'minute')

        var plus = moment(bookingTime).add('30', 'minute')

        let finalSuppliers = suppliers

        for (let i = 0; i < suppliers.length; i++) {
          let jobs = await Job.find({
            'supplier.supplierId': suppliers[i].id,
            bookingTime: {
              $gt: minus,
              $lt: plus
            },
            $or: [
              { status: jobStatus.ACCEPT },
              { status: jobStatus.IN_PROGRESS },
              { status: jobStatus.ARRIVED }
            ]
          })
          if (jobs.length > 0) {
            await finalSuppliers.splice(i, 1)
            console.log('after splice', finalSuppliers)
          }
        }

        return new OKSuccess('List of suppliers', finalSuppliers)
      } else {
        jobData['status'] = jobStatus.DECLINE
        let job = new Job(jobData)
        await job.save()
        throw new NotFoundError(
          'No Supplier is currently active, Job id: ' +
          jobData['id'] +
          ' is declined.',
          { jobId: jobData.id, fcmToken: userData.fcmToken }
        )
      }
    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async createPin() {
    var digits = '0123456789'
    let OTP = ''
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)]
    }
    return OTP
  }

  async checkSupplierAvalibility(supplierId) {
    try {
      var minus = moment().subtract('30', 'minute')
      var plus = moment().add('30', 'minute')

      let jobs = await Job.find({
        'supplier.supplierId': supplierId,
        'supplier.acceptedTime': {
          $gt: minus,
          $lt: plus
        },
        $or: [
          { status: jobStatus.ACCEPT },
          { status: jobStatus.IN_PROGRESS },
          { status: jobStatus.ARRIVED }
        ]
      })

      if (jobs.length > 0) {
        return false
      } else {
        return true
      }
    } catch (err) {
      return err
    }
  }

  async acceptJob(jobId, supplier, supplierName) {
    try {
      let isJobExist = await Job.findOne({ id: jobId, status: 'request' })
      if (!isJobExist) {
        throw new NotFoundError({
          message: `Job is not available by this id: ${jobId}`
        })
      }

      let jobBookingType = isJobExist.charges.serviceCharge[0].bookingType
      if (jobBookingType === bookingType.ADVANCE) {
        let minDiff = moment(isJobExist['bookingTime']).diff(
          moment(),
          'minutes'
        )
        if (minDiff < 15) {
          throw new NotFoundError(
            'Minimum accept time limit reached for advance booking!'
          )
        }
      } else if (jobBookingType === bookingType.URGENT) {
        let minDiff = moment(isJobExist['bookingTime']).diff(
          moment(),
          'minutes'
        )
        console.log("minDiff", minDiff)
        if (minDiff < 10) {
          throw new NotFoundError(
            'Minimum accept time limit reached for urgent booking!'
          )
        }
      }

      let isAvailable = await this.checkSupplierAvalibility(supplier.supplierId)
      if (!isAvailable) {
        throw new NotFoundError({
          message: `Another job is running or schedule by supplier: ${supplier.supplierId}`
        })
      }

      supplier['acceptedTime'] = new Date()

      isJobExist['supplier'] = supplier
      isJobExist['status'] = jobStatus.ACCEPT
      isJobExist['verificationCode']['code'] = await this.createPin()
      isJobExist['verificationCode']['time'] = new Date()

      await isJobExist.save()

      let populateData = await Job.find({ id: isJobExist.id })
        .populate('users', 'name email phoneNumber fcmToken balance')
        .populate('services', 'name bookingType chargesType category')
        .populate('suppliers', 'name email phoneNumber fcmToken balance')
      console.log("hello: ", populateData[0].users[0].email);
      let generatedId = populateData[0].id;
      let emailDetail = {
        verificationCode: populateData[0].verificationCode.code,
        email: populateData[0].users[0].email,
        name: populateData[0].users[0].name,
        jobId: `${generatedId.split('-')[0]}${generatedId.split('-')[1]}${generatedId.split('-')[3]}`
      }

      const emailService = await new EmailService().sendEmailInvite("", emailDetail, "verification", "verification");

      return new OKSuccess('Job accepted by: ' + supplierName, populateData)
    } catch (err) {
      console.log(err)
      return err
    }
  }

  async cancelJob(jobId, accountType) {
    try {
      let isJobExist = await Job.findOne({ id: jobId })
      if (!isJobExist) {
        throw new NotFoundError({
          message: `Job is not available by this id: ${jobId}`
        })
      }

      let status = isJobExist.status
      console.log("accoutn", accountType)
      switch (accountType) {
        case 'consumer':
          console.log('incoming in user')
          if (status === jobStatus.REQUEST) {
            isJobExist['status'] = jobStatus.CANCEL
            await isJobExist.save()
            let populateData = await Job.find({ id: isJobExist.id })
              .populate('users', 'name email phoneNumber fcmToken balance')
              .populate('services', 'name bookingType chargesType category')
            return new OKSuccess(
              'Job cancelled by ' + accountType,
              populateData
            )
          } else if (status === jobStatus.ACCEPT) {
            let acceptedTime = isJobExist.supplier.acceptedTime
            let generatedTime = moment(acceptedTime).format()
            let minuteDifference = moment().diff(generatedTime, 'minutes')
            if (minuteDifference > 2) {
              isJobExist['status'] = jobStatus.CANCEL
              isJobExist['charges']['baseCharge'] =
                PenaltyCharges.consumer_charges
            } else {
              isJobExist['status'] = jobStatus.CANCEL
            }
            await isJobExist.save()
            let populateData = await Job.find({ id: isJobExist.id })
              .populate('users', 'name email phoneNumber fcmToken balance')
              .populate('suppliers', 'name email phoneNumber fcmToken balance')
              .populate('services', 'name bookingType chargesType category')
            return new OKSuccess(
              'Job cancelled by ' + accountType,
              populateData
            )
          } else {
            return new NotFoundError({ message: `Invalid status` })
          }
        case 'supplier':
          if (status === jobStatus.ACCEPT) {
            let acceptedTime = isJobExist.supplier.acceptedTime
            let generatedTime = moment(acceptedTime).format()
            let minuteDifference = moment().diff(generatedTime, 'minutes')

            if (minuteDifference > 2) {
              isJobExist['status'] = jobStatus.PATNER_CANCEL
              isJobExist['charges']['baseCharge'] =
                PenaltyCharges.supplier_charges
            } else {
              isJobExist['status'] = jobStatus.PATNER_CANCEL
            }
            await isJobExist.save()
            let populateData = await Job.find({ id: isJobExist.id })
              .populate('users', 'name email phoneNumber fcmToken balance')
              .populate('suppliers', 'name email phoneNumber fcmToken balance')
              .populate('services', 'name bookingType chargesType category')
            return new OKSuccess(
              'Job cancelled by ' + accountType,
              populateData
            )
          } else {
            return new NotFoundError({ message: `Invalid status` })
          }
        default:
          return new NotFoundError({ message: `User Type is incorrect` })
      }
    } catch (err) {
      console.log("cancelJob err:" + err)
      return err
    }
  }


  async arrivedJob(jobData) {

    try {
      jobData.status = jobStatus.ARRIVED;
      let job = new Job(jobData)
      let result = await job.save()
      let populateData = await Job.find({ id: jobData.id })
        .populate('users', 'name email phoneNumber fcmToken balance')
        .populate('services', 'name bookingType chargesType category')
        .populate('suppliers', 'name email phoneNumber fcmToken balance')
      return new OKSuccess('Supplier is arrived!', populateData)
    } catch (err) {
      console.log(err)
      return err
    }
  }



  async getAll(query) {

    try {
      let filter = { "$and": [] };

      let { skip, page, status, _search, from, to } = query;
      skip = skip || 0;
      let mysort = { 'bookingTime': -1 };
      page = page || 0;
      _search = _search == undefined || "" ? "" : _search.trim();

      if (status) {
        filter["$and"].push({ status: status })
      }

      if (from && to) {
        filter["$and"].push({
          bookingTime: {
            $gte: new Date(from),
            $lte: new Date(to)
          }
        })
      }

      if (_search) {
        filter["$and"].push({
          "$or": [
            { "userInfo.name": { $regex: _search, $options: "i" } },
            { "userInfo.email": { $regex: _search, $options: "i" } },
            { "userInfo.id": { $regex: _search, $options: "i" } },
            { "userInfo.phoneNumber": { $regex: _search, $options: "i" } },
            { "user.userId": { $regex: _search, $options: "i" } },
            { "supplierInfo.name": { $regex: _search, $options: "i" } },
            { "supplierInfo.email": { $regex: _search, $options: "i" } },
            { "supplierInfo.phoneNumber": { $regex: _search, $options: "i" } },
            { "serviceInfo.name": { $regex: _search, $options: "i" } },
            { "serviceCategoryInfo.serviceName": { $regex: _search, $options: "i" } },
          ]
        })
      }

      if (!status && !from && !to && !_search) {
        delete filter["$and"];
      }

      let record = [];
      if (skip >= 0) {
        if (page > 0) {
          record.push({ $skip: _search ? 0 : Number(skip) * Number(page) });
        }
      }
      if (page > 0 && skip >= 0) {
        record.push({ $limit: Number(page) })
      }
      record.push({
        $project: {
          _id: 1,
          status: 1,
          charges: 1,
          bookingTime: 1,
          verificationCode: 1,
          createdAt: 1,
          updatedAt: 1,
          userFeedback: 1,
          supplierFeedback: 1,
          "user.name": "$userInfo.name",
          "user.email": "$userInfo.email",
          "user.phoneNumber": "$userInfo.phoneNumber",
          "user.balance": "$userInfo.balance",
          "user.location": 1,
          "supplier.name": "$supplierInfo.name",
          "supplier.email": "$supplierInfo.email",
          "supplier.phoneNumber": "$supplierInfo.phoneNumber",
          "supplier.balance": "$supplierInfo.balance",
          "serviceNames": {
            $concatArrays:
              ["$serviceInfo.name", "$serviceCategoryInfo.serviceName"]
          }
        },
      })
      let jobs = await Job.aggregate([
        {
          $lookup: {
            from: Supplier.collection.name,
            localField: "supplier.supplierId",
            foreignField: "id",
            as: "supplierInfo",
          }
        },
        {
          $lookup: {
            from: User.collection.name,
            localField: "user.userId",
            foreignField: "id",
            as: "userInfo",
          }
        },

        {
          $lookup: {
            from: Service.collection.name,
            localField: "charges.serviceCharge.id",
            foreignField: "id",
            as: "serviceInfo",
          }
        },

        {
          $lookup: {
            from: ServicesCategory.collection.name,
            localField: "charges.serviceCharge.id",
            foreignField: "id",
            as: "serviceCategoryInfo",
          }
        },

        {
          $unwind:
          {
            path: "$supplierInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind:
          {
            path: "$userInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            $and: [
              filter
            ]
          },
        },
        { '$sort': mysort },
        {
          $facet: {
            count: [{ $count: "total" }],
            data: record
          },
        },
      ]);

      jobs.options = { allowDiskUse: true };

      if (jobs[0].data.length > 0) {
        for (let i = 0; i < jobs[0].data[0].charges.serviceCharge.length; i++) {
          jobs[0].data[0].charges.serviceCharge[i]['name'] = jobs[0].data[0].serviceNames[i]
        }

        delete jobs[0].data[0].serviceNames;
      }

      let total = jobs[0]?.count[0]?.total;
      let pagination = total !== undefined && page > 0 && skip >= 0 && await Pagination(total, page, skip)
      if (pagination) {
        return { jobs, pagination }
      }
      else {
        return { jobs }
      }
    }

    catch (err) {
      console.log("err", err)
    }

  }

  async verifyCode(data, code) {
    try {
      let generatedCode = data.verificationCode.code
      if (generatedCode === code) {
        data['status'] = jobStatus.IN_PROGRESS
        data['verificationCode']['isValidate'] = true
        data['verificationCode']['time'] = new Date()
        data['charges']['serviceCharge'][0]['time'].push({
          startTime: new Date(),
          endTime: ''
        })
        data['charges']['baseCharge'] = BaseCharges.charges;
        let job = new Job(data)
        let result = await job.save()
        return new OKSuccess('Code verified, Job has been started.', result)
      } else {
        return new UnauthorizedError('Invalid verification code!')
      }
    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async addService(jobData, serviceData) {
    try {
      console.log('jobData', jobData)
      console.log('serviceData', serviceData)

      let exist = jobData.charges.serviceCharge.findIndex(data => {
        return data.id === serviceData.id
      })

      if (exist === -1) {
        jobData.charges.serviceCharge.push({
          id: serviceData['id'],
          amount: serviceData['baseCharges'],
          bookingType: serviceData['bookingType'],
          chargesType: serviceData['chargesType'],
          status: serviceStatus['IN-PROGRESS'],
          time: [
            {
              startTime: new Date(),
              endTime: null
            }
          ]
        })

        let job = new Job(jobData)
        let result = await job.save()
        return new OKSuccess('service successfully added!', result)
      } else {
        throw new InternalServerError('Service already exist!')
      }
    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async pauseJob(jobData, serviceId) {
    try {
      let { serviceCharge } = jobData.charges
      let exist = serviceCharge.findIndex(service => {
        return service.id === serviceId
      })
      if (exist !== -1) {
        jobData.charges.serviceCharge[exist].time.forEach(data => {
          if (data.endTime === null) {
            data.endTime = new Date()
            jobData.charges.serviceCharge[exist].status = serviceStatus.PAUSED;
            return
          }
        })

        let countPausedServices = jobData.charges.serviceCharge.filter(service => service.status === serviceStatus.PAUSED).length;
        if (countPausedServices === jobData.charges.serviceCharge.length) { jobData.status = jobStatus.PENDING }

        let job = new Job(jobData)
        let result = await job.save()
        return new OKSuccess('Service paused successfully!', result)

      } else {
        throw new InternalServerError(
          'No service exist in this job with this id: ' + serviceId + ''
        )
      }
    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async endJob(jobData, serviceId) {
    try {
      let { serviceCharge } = jobData.charges
      let exist = serviceCharge.findIndex(service => {
        return service.id === serviceId
      })
      if (exist !== -1) {
        jobData.charges.serviceCharge[exist].time.forEach(data => {
          if (data.endTime === null) {
            data.endTime = new Date()
            jobData.charges.serviceCharge[exist].status = serviceStatus.ENDED;
            return
          }
        })

        let countPausedServices = jobData.charges.serviceCharge.filter(service => service.status === serviceStatus.PAUSED).length;
        if (countPausedServices === jobData.charges.serviceCharge.length) { jobData.status = jobStatus.PENDING }

        let job = new Job(jobData)
        let result = await job.save()
        return new OKSuccess('Service ended successfully!', result)
      } else {
        throw new InternalServerError(
          'No service exist in this job with this id: ' + serviceId + ''
        )
      }
    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async restartJob(jobData, serviceId) {
    try {
      let { serviceCharge } = jobData.charges
      let exist = serviceCharge.findIndex(service => {
        return service.id === serviceId
      })
      if (exist !== -1) {
        jobData.charges.serviceCharge[exist].status = serviceStatus['IN-PROGRESS'];
        jobData.charges.serviceCharge[exist].time.push({
          startTime: new Date(),
          endTime: null
        })
        jobData.status = jobStatus.IN_PROGRESS
        let job = new Job(jobData)
        let result = await job.save()
        return new OKSuccess('Service restarted successfully!', result)
      } else {
        throw new InternalServerError(
          'No service exist in this job with this id: ' + serviceId + ''
        )
      }
    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async calculateJobCompletion(serviceCharge) {
    let calculateBaseCharge = 0;
    let finalStatus = true;
    for (let i = 0; i < serviceCharge.length; i++) {

      for (let j = 0; j < serviceCharge[i].time.length; j++) {
        if (serviceCharge[i].status === serviceStatus['IN-PROGRESS']) {
          // return { status: false };
          finalStatus = false;
        }
      }

      if (!finalStatus) { console.log("is this worth it?"); break; }


      if (serviceCharge[i].chargesType === chargesType.FIXED) {
        calculateBaseCharge += serviceCharge[i].amount;
      }

      if (serviceCharge[i].chargesType === chargesType.HOURLY) {
        let startTime = moment(serviceCharge[i].time[0].startTime);
        let endTime = moment(serviceCharge[i].time[serviceCharge[i].time.length - 1].endTime);

        console.log("startTime", startTime)
        console.log("endTime", endTime)

        let minDiff = endTime.diff(startTime, 'minutes');

        if (minDiff >= 60) {
          let divide = minDiff / 60;
          divide = Math.ceil(divide);
          calculateBaseCharge += (serviceCharge[i].amount * divide);
        }
        else {
          calculateBaseCharge += serviceCharge[i].amount;
        }
      }

    }

    return { status: finalStatus, totalCharge: calculateBaseCharge };
  }

  async completeJob(jobData) {
    try {
      let { serviceCharge } = jobData.charges

      let validate = await this.calculateJobCompletion(serviceCharge);

      if (!validate.status) {
        return new InternalServerError("Please end the paused job first!")
      }
      else {
        jobData.status = jobStatus.COMPLETED;
        jobData.charges.totalCharge += validate.totalCharge;
        let job = new Job(jobData)
        let result = await job.save()
        let populateData = await Job.find({ id: jobData.id })
          .populate('users', 'name email phoneNumber fcmToken balance')
          .populate('services', 'name bookingType chargesType category')
          .populate('suppliers', 'name email phoneNumber fcmToken balance')
        return new OKSuccess('Job completed successfully!', populateData)
      }
    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async addEquipmentCharges(jobData, equipmentCharge) {
    try {
      console.log('jobData', jobData)
      jobData.charges.equipmentCharge = equipmentCharge;
      let job = new Job(jobData)
      let result = await job.save()
      return new OKSuccess('Equipment charges successfully added!', result)

    } catch (err) {
      throw new InternalServerError(err)
    }
  }

  async getOneJob(id) {
    try {
      const job = await Job.findOne({ id: id }).populate('users', 'name email phoneNumber fcmToken balance')
        .populate('suppliers', 'name email phoneNumber fcmToken balance profilePicture')
      if (!job) {
        throw new InternalServerError(`Job is not available by this id: ${id}`);

      }
      return new OKSuccess('Job Found!', job);
    }
    catch (err) {
      return new InternalServerError(err);
    }

  }

  async reviewRating(accountType, jobDetail, body) {
    try {
      if (jobDetail.status !== "completed") {
        throw new InternalServerError('Job is not completed');
      }
      if (body.rating > 5 || body.rating < 0) {
        throw new InternalServerError('Rating should be in between 0 to 5');
      }
      if (accountType === "consumer") {
        body.time = new Date();
        jobDetail["userFeedback"] = body;
      }
      if (accountType === "supplier") {
        body.time = new Date();
        jobDetail["supplierFeedback"] = body;
      }
      console.log("jobDetail:", jobDetail)
      let job = new Job(jobDetail)
      const saveJob = await job.save()
      return new OKSuccess('Feedback inserted!', saveJob);
    }
    catch (err) {
      return new InternalServerError(err);
    }
  }

  async getUserJobs(params, query) {
    try {
      const { accountType, id } = params;
      const { status, skip, perPage } = query;
      let filter = {};

      if (accountType === "consumer") {
        filter = { "user.userId": id };
      }
      if (accountType === "supplier") {
        filter = { "supplier.supplierId": id };
      }
      if (status === 'request') {
        filter['$or'] = [
          { 'status': 'request' },
          { 'status': 'accept' },
          { 'status': 'arrived' }
        ]
      }

      if (status === 'completed') {
        filter['status'] = status;
      }

      if (status === 'in-progress') {
        filter['$or'] = [
          { 'status': 'in-progress' },
          { 'status': 'pending' }
        ]

      }
      if (status === 'decline') {
        filter['$or'] = [
          { 'status': 'decline' },
          { 'status': 'cancel' },
          { 'status': 'partner-cancel' }
        ]
      }

      let job = await Job.find(filter)
        .populate("charges.serviceCharge.service", "name")
        .populate("charges.serviceCharge.category", "serviceName")

        .populate("user.name", "name")
        .sort('-updatedAt')
        .limit(parseInt(perPage))
        .skip(parseInt(skip * parseInt(perPage)));

      if (job.length >= 1) {
        const count = await Job.countDocuments(filter);
        let pagination = await Pagination(count, perPage, skip)
        // return { pagination, job, status: 200 };
        return new OKSuccess("Available Jobs: ", { pagination, job })
      }
      else {
        // return { msg: "No available jobs", status: 404 };
        return new NotFoundError("No available jobs")
      }
    }
    catch (err) {
      console.log("err", err)
      // return err;
      return new InternalServerError('err', err)
    }
  }


  // async deleteReview(id, accountType, data) {
  //   try {
  //     if (accountType === "supplier") {
  //       if (data.supplierFeedback.length > 0) {
  //         const supplierReviewIndex = data.supplierFeedback.find((record, index) => {
  //           if (record.id === id) {
  //             data.supplierFeedback.splice(index, 1);
  //           } else {
  //             throw new InternalServerError(`Review is not available by this id: ${id}`);
  //           }
  //         });
  //         data.supplierFeedback.splice(supplierReviewIndex, 1);
  //       }
  //     } else if (accountType === "consumer") {
  //       if (data.userFeedback.length > 0) {
  //         const userReviewIndex = data.userFeedback.findIndex(record => record.id === id);
  //         data.userFeedback.splice(userReviewIndex, 1);
  //       } else {
  //         throw new InternalServerError(`Review is not available by this id: ${id}`);
  //       }
  //     }
  //     let job = new Job(data)
  //     const saveJob = await job.save()
  //     return new OKSuccess('Feedback Deleted!', saveJob);
  //   }
  //   catch (err) {
  //     return new InternalServerError(err);
  //   }
  // }

}

module.exports = JobService
