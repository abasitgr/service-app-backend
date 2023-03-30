const UserService = require("../service/user.service");
const SupplierService = require("../service/supplier.service");
const JobService = require('../service/job.service')

const User = require("../model/user.model");
const { OKSuccess } = require("../utils/success");
const { NotFoundError, InternalServerError, UnauthorizedError } = require("../utils/error");
const { convertImage } = require("../utils/helper");

module.exports.Registration = async (req, res) => {
  try {
    const { body } = req;
    const userService = new UserService();
    const user = await userService.addUser(body);
    if (user.status === 409) {
      return res.status(user.status).send(user);
    }
    const success = new OKSuccess("Successfully Added the user", user);
    res.status(success.status).send(success);
  }
  catch (err) {
    console.log(err);
    res.status(err.status).send(err);
  }
}


module.exports.getAll = async (req, res) => {
  try {
    let result = await new UserService().getAll(req);
    let response;

    if (result.users.length)
      response = new OKSuccess("Successfully Retrive the users", result);
    else
      response = new NotFoundError({ mesg: "No user in the database" });

    res.status(response.status).send(response);

  }
  catch (err) {
    res.status(500).send(err);
  }
}

module.exports.userProfile = async (req, res) => {

  try {
    const { user } = req;
    let data = await User.findOne({ id: user, isDelete: false });
    let response;
    let url = ''
    if (data) {
      if (data.profilePicture) {
        url = await convertImage(data.profilePicture)
      }
      data = Object.assign(data.toObject(), { url })
      response = new OKSuccess("User details", data)
    } else
      response = new NotFoundError("No Record Found", data);
    res.status(response.status).send(response);
  }
  catch (err) {
    return res.status(500).send(err);
  }
}

module.exports.getOne = async (req, res) => {

  try {
    const { id } = req.params;
    let user = await User.findOne({ id, isDelete: false });
    let url = '';
    let response;
    if (user) {
      if (user.profilePicture) {
        url = await convertImage(user.profilePicture)
      }

      user = Object.assign(user.toObject(), { url })
      response = new OKSuccess("User details", user)
    } else
      response = new NotFoundError("No Record Found", user);
    res.status(response.status).send(response);
  }
  catch (err) {
    return res.status(500).send(err);
  }
}



module.exports.removeUser = async (req, res) => {
  try {

    const user = await new UserService().userDetail(req, 'isDelete');
    const success = new OKSuccess({ message: "User Information updated ", user });
    return res.status(success.status).send(success);
  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}

module.exports.userStatus = async (req, res) => {
  try {

    const user = await new UserService().userDetail(req, 'isActive');
    const success = new OKSuccess({ message: "User Information updated ", user });
    return res.status(success.status).send(success);
  }
  catch (err) {
    return res.status(err.status).send(err);
  }
}



module.exports.editUser = async (req, res) => {
  try {
    const { body, user } = req;
    let id = user
    // console.log(user, "USER ID", id)
    const data = await new UserService().updateUser({ body, id, req });
    if (data.status === 404 || data.status === 409) {
      return res.status(data.status).send(data);
    }
    const success = new OKSuccess({ message: "User Information updated ", data });
    return res.status(success.status).send(success);
  }
  catch (err) {
    console.log("err", err)
    return res.status(err.status).send(err);
  }
}


module.exports.sendOTPToUser = async (req, res) => {
  try {
    const { body } = req;
    const { phoneNumber } = body;
    const isRegisterUser = await User.findOne({ phoneNumber, isDelete: false, isActive: true });
    if (!isRegisterUser) {
      return res.status(400).send(new NotFoundError("Not Found", isRegisterUser))
    }
    const userServices = new UserService();
    const generatedOTPForUser = await userServices.generateOTP(isRegisterUser);
    console.log("generatedOTPForUser", generatedOTPForUser);
    const success = new OKSuccess({ message: "OTP has been send", generatedOTPForUser });
    res.status(success.status).send(success);
  }
  catch (err) {
    console.log(err);
    res.status(err.status).send(err);
  }
}
module.exports.OTPVerification = async (req, res) => {
  try {
    const { body } = req;
    const { phoneNumber, code } = body;
    const isRegisterUser = await User.findOne({ phoneNumber, isDelete: false, isActive: true });
    if (!isRegisterUser) {
      return res.status(400).send(new NotFoundError("Not Found", isRegisterUser))
    }
    const userServices = new UserService();
    const verifiedOTP = await userServices.verifyOTP(isRegisterUser, code);
    const response = verifiedOTP.status === 401 ? verifiedOTP : new OKSuccess("User details", verifiedOTP)
    res.status(response.status).send(response);
  }
  catch (err) {
    res.status(401).send(err);
  }
}


