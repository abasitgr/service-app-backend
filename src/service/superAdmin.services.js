const admin=require('../model/admin.model');
const { InternalServerError, NotFoundError, ConfictError, ForbiddenError, BadRequestError } = require("../utils/error");

class SuperAdmin {
  async login ( email ) {
    const admin = await this.getSuperAdmin( email );
    if(!admin){
      throw new BadRequestError({ message: `account with ${email} does not exist` });
     }
    if(!admin.isActive){
      throw new ForbiddenError({message:"your account has been deactivated"})
    }
    return admin;
  }

  async getSuperAdmin ( email ) {
   const isAlreadyExist = await admin.findOne({ email });
   return isAlreadyExist;
  }
}

module.exports = SuperAdmin;