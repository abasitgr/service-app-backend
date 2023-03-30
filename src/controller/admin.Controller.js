const passport = require("passport");
const AdminServices = require("../service/admin.services");
const { OKSuccess } = require("../utils/success");
const { BadRequestError , NotFoundError} = require("../utils/error");
// const { notificationSent, addToNotification } = require("../utils/notification")
var adminServices = new AdminServices();

module.exports.AddAdmin = async (req, res) => {
  try {
    // console.log("req.user", req.user)
    const admin = await adminServices.addAdmin(req);
    if (admin.status === 409 || admin.status === 404) {
      return res.status(admin.status).send(admin);
    }
    const success = new OKSuccess({ message: `${req.body.accountType} successfully Added`, data: admin });
    return res.status(success.status).send(success);
  }

  catch (err) {
    res.status(err.status).send(err);
  }
}

module.exports.getAll = async (req, res) => {
  try {
    const allAdmins = await adminServices.getAll(req);
    let response;
    if (allAdmins?.admins?.length)
      response = new OKSuccess("Successfully retrive the admins", allAdmins);
    else
      response = new NotFoundError({ mesg: "No user in the database" });

    res.status(response.status).send(response);
  }
  catch (err) {
    console.log("err",err)
    res.status(500).send(err);
  }
}

module.exports.AdminLogin = async (req, res) => {
  try {
    const { chatToken } = req.body;
    console.log("chatToken: ", chatToken);
    // await addToNotification(chatToken);

    const response = await new Promise((resolve, reject) => {
      passport.authenticate('Adminlocal', (err, user, info) => {
        if (err) {
          return reject(err);
        }
        if (!user) {
          // unauthorized
          console.log('password not match unauthorized');
          return reject(info);
        }
        const jwtToken = info.setJWT();
        resolve({ token: jwtToken, info });
      })(req, res);
    })
    const success = new OKSuccess({ data: response });
    return res.status(success.status).send(success);
  } catch (err) {
    console.log('error in login ', err);
    res.status(err.status).send(err);
  }
}

module.exports.EditAdminInfo = async (req, res) => {
  console.log("66")
  try {
    const { body } = req;
    const { id } = req.params;
    if (!id) {
      const Error = new BadRequestError({ messgae: "Id is not suppled" })
      return res.status(Error.status).send(Error);
    }
    const admin = await adminServices.updateAdminDetails({ body, id });
    const success = new OKSuccess({ message: "Admin Information updated ", admin });
    return res.status(success.status).send(success);
  }
  catch (err) {
    console.log("eer", err)
    return res.status(err.status).send(err);
  }
}

module.exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await adminServices.getAdmin("id", id, "isDelete", false);
    const response = admin ? new OKSuccess("Admin details", admin) : new NotFoundError("No Record Found", admin);
    res.status(response.status).send(response);
  }
  catch (err) {
    return res.status(500).send(err);
  }
}