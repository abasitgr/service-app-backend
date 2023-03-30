const Joi = require('joi');
const { RegularExp } = require("../constants");
const { joiResponse } = require("../utils/helper")


module.exports.supplierValidation = (req, res, next) => {

    console.log("Joi incoming data", req.body);
    const { body } = req;
    const pakRegex = /^((\+92)|(0092))-{0,1}\d{3}-{0,1}\d{7}$|^\d{11}$|^\d{4}-\d{7}$/;

    const schema = Joi.object().keys({
        'name': Joi.string().regex(RegularExp.specialChar).min(3).label('name'),
        'email': Joi.string().email().label('Email'),
        'phoneNumber': Joi.string().min(11).max(13).regex(pakRegex).label('Phone Number'),
        'fcmToken' : Joi.array().optional(),
        "profilePicture": Joi.string().label("profilePicture").optional(),
    }).options({ abortEarly: false, allowUnknown: false });
    const result = schema.validate(body);
    joiResponse(result, res, next);

};


