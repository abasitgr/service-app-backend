const Admin = require("../model/admin.model");
const { InternalServerError, NotFoundError, ConfictError, ForbiddenError, BadRequestError } = require("../utils/error");
const {Pagination} = require("../utils/pagination");

class AdminServices {
  async addAdmin(req){
    try{
      const { body } = req;
      const { email, phoneNumber } = body;
      console.log("BODY: ", body);

      let isAdminAlreadyExist = await this.getAdmin( "email" , email );
      if(isAdminAlreadyExist) {
        throw new ConfictError({ message:`Account with this email ${email} already exist`});
      }
       
      isAdminAlreadyExist = await this.getAdmin('phoneNumber', phoneNumber);
      if(isAdminAlreadyExist) {
        throw new ConfictError({ message:`Account with this Phone Number ${phoneNumber} already exist`});
      }

      const admin = new Admin( body );
      console.log("ADMIN: ", admin, req.user);
      admin.createdBy = req.user;
      await admin.save();
      await admin.setHashedPassword();
      return(admin);
    }
    catch (err) {
      if (err.status === 409 || err.status === 404)
          return err;
      else
          throw new InternalServerError({ message: 'Error in adding admin', data: err })
  }
  }

  async login (email) {
    const admin = await this.getAdmin( "email" , email );
    if(!admin){
      throw new BadRequestError({ message: `account with ${email} does not exist` });
     }
    if(!admin.isActive){
      throw new ForbiddenError({message:"your account has been deactivated"})
    }
    return admin;
  }

  async getAdmin (key, value) {
    const isAlreadyExist = await Admin.findOne({ [key]:value });
    return isAlreadyExist;
  }
  

  async updateAdminDetails({body, id}) {
    try{
      console.log("11")
       const admin = await Admin.findOneAndUpdate({ id } ,{ $set: body } , {new: true})
       if(!admin) {
        throw new BadRequestError({message:"Admin does not exist"})
       }
       return admin;
    }
    catch(err){
      if (err.status === 409 || err.status === 404)
          return err;
      else
          throw new InternalServerError({ message: 'Error in Updating admin', data: err })
  }
  }

  async getAll(data){
    try {
      let skip = data.query.skip;
      var mysort = { createdAt: -1 };
      let role = data.query.role
      let perPage = data.query.page;
      var _search =
          data.query.search == undefined || "" ? "" : data.query.search.trim();

      const admins = await Admin.find({
          $or: [
            {
              email: { $regex: ".*" + _search + ".*" },
              isDelete: false,
              accountType: {$regex: ".*" + role + ".*" }
            },
            {
                name: { $regex: ".*" + _search + ".*" },
                isDelete: false,
                accountType: {$regex: ".*" + role + ".*" }
            
            },
            
          ],
      })
        .sort(mysort)
        .limit(parseInt(parseInt(perPage)))
        .skip(parseInt(_search ? 0 : skip * parseInt(perPage)));
      if (admins.length >= 1) {
        const count = await Admin.countDocuments({
          $or: [
            {
              email: { $regex: ".*" + _search + ".*" },
              isDelete: false,
            },
            {
              name: { $regex: ".*" + _search + ".*" },
              isDelete: false,
            }
          ],
        });
        let pagination = await Pagination(count, perPage ,skip)
        return { pagination, admins, status: 200 };
      }
      else {
        return { msg: "No available admins", status: 404 };
      }
    }
    catch (err) {
        console.log(err);
        throw new InternalServerError(err);
    }
  }
}

module.exports = AdminServices;