const Joi = require('joi');
const { adminType } = require("../enums");
const { RegularExp } = require("../constants");
const { joiResponse } = require("../utils/helper")


module.exports.adminValidation = (req, res, next) => {

    // console.log("Joi incoming data", req.body);
    const { body } = req;
    const pakRegex = /^((\+92)|(0092))-{0,1}\d{3}-{0,1}\d{7}$|^\d{11}$|^\d{4}-\d{7}$/;


    const schema = Joi.object().keys({
        'name': Joi.string().regex(RegularExp.specialChar).trim().label('name').min(3),
        'email': Joi.string().label('email').email(),
        'password': Joi.string().trim().label("password").min(5),
        'phoneNumber': Joi.string().length(13).regex(pakRegex).label('Phone Number'),
        'accountType': Joi.string().label('Account Type').valid(...Object.values(adminType)),
        "isActive": Joi.boolean().label("isActive"),
        "isDelete": Joi.boolean().label("isDelete"),
        'updatedBy': Joi.string(),
        'createdBy': Joi.string()
    }).options({ abortEarly: false, allowUnknown: false });

    const result = schema.validate(body);
    joiResponse(result, res, next);
};

