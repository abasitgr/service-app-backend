const Joi = require('joi');
const { RegularExp } = require("../constants");
const { joiResponse } = require("../utils/helper")
const { chargesType,bookingType } = require("../enums");

module.exports.servicesValidation = (req, res, next) => {
    const { body } = req;
    const schema = Joi.object().keys({
        'name': Joi.string().regex(RegularExp.specialChar).trim().label('Service Name').min(3),
        'image': Joi.string().label("image"),
        'description': Joi.string().optional(),
        "category": Joi.string().label('category'),
        'baseCharges': Joi.number().integer().min(0),
        'chargesType': Joi.string().label("charges type").valid(...Object.values(chargesType)).required(),
        'bookingType': Joi.string().label("booking type").valid(...Object.values(bookingType)).required(),
        'updatedBy': Joi.string(),
        'createdBy': Joi.string()

    }).options({ abortEarly: false, allowUnknown: false });

    const result = schema.validate(body);
    joiResponse(result, res, next);


};

