const Joi = require('joi');
const { RegularExp } = require("../constants");
const { chargesType,bookingType } = require("../enums");

const { joiResponse } = require("../utils/helper")
module.exports.serviceCategoryValidation = (req, res, next) => {
    const { body } = req;
    const schema = Joi.object().keys({
        'serviceName': Joi.string().regex(RegularExp.specialChar).trim().label('Service Name').min(3),
        'description': Joi.string().optional(),
        'image': Joi.string().label("image"),
        'baseCharges': Joi.number().integer().min(0),
        'chargesType': Joi.string().label("charges type").valid(...Object.values(chargesType)).optional(),
        'bookingType': Joi.string().label("booking type").valid(...Object.values(bookingType)).optional(),
        'updatedBy': Joi.string(),
        'createdBy': Joi.string()
    }).options({ abortEarly: false, allowUnknown: false });

    const result = schema.validate(body);
    joiResponse(result, res, next);

};

