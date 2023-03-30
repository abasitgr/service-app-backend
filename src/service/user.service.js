const User = require('../model/user.model');
const { ConfictError, InternalServerError, UnauthorizedError, NotFoundError } = require("../utils/error");
const { OKSuccess } = require("../utils/success");
const { Pagination } = require("../utils/pagination");
const imageUpload = require("../utils/azureImageUpload");
const moment = require('moment-timezone');
const { userReponse, createPin, sendSMS } = require("../utils/helper")
const sharp = require('sharp');
const EmailService = require("../service/email.service");



class UserService {

    constructor() {
    }

    async getAll(data) {
        try {
            let skip = data.query.skip;
            var mysort = { createdAt: -1 };
            let perPage = data.query.page;
            var _search =
                data.query.search == undefined || "" ? "" : data.query.search.trim();
            const users = await User.find({
                $or: [
                    {
                        email: { $regex: ".*" + _search + ".*" },
                        isDelete: false,

                    },
                    {
                        phoneNumber: { $regex: ".*" + _search + ".*" },
                        isDelete: false,

                    },

                ],
            })
                .sort(mysort)
                .limit(parseInt(parseInt(perPage)))
                .skip(parseInt(_search ? 0 : skip * parseInt(perPage)));
            if (users.length >= 1) {

                const count = await User.countDocuments({
                    $or: [
                        {
                            email: { $regex: ".*" + _search + ".*" },
                            isDelete: false,

                        },
                        {
                            phoneNumber: { $regex: ".*" + _search + ".*" },
                            isDelete: false,

                        },
                    ],
                });

                let pagination = await Pagination(count, perPage, skip)
                return { users, pagination };
            } else {
                return { users };
            }

        }
        catch (err) {
            console.log(err);
            throw new InternalServerError(err);
        }
    }

    async addUser(body) {
        try {
            const { email, phoneNumber } = body;
            let user;
            user = await User.findOne({
                email,
                isDelete: false,

            })

            if (user)
                throw new ConfictError({ message: `user already exsit this emaill: ${user.email}` });

            user = await User.findOne({
                phoneNumber,
                isDelete: false,
            })
            if (user)
                throw new ConfictError({ message: `user already exsit this phone no: ${user.phoneNumber}` });
            user = new User(body);
            const saveUser = await user.save();
            return saveUser
        } catch (err) {
            if (err.status === 409)
                return err;
            else
                throw new InternalServerError({ message: `user registration error`, data: err });
        }
    }


    async updateUser({ body, id, req }) {
        // console.log("File: ", req.file)
        try {
            const data = await User.findOne({ id: id, isDelete: false })
            if (!data) {
                throw new NotFoundError({ message: `User is not available by this id: ${id}` });
            }
            const { email, phoneNumber } = body;
            let user;
            user = await User.findOne({
                email,
                isDelete: false,


            })

            if (user && user.id !== id)
                throw new ConfictError({ message: `This email address: ${user.email} already exist another account.` });

            user = await User.findOne({
                phoneNumber,
                isDelete: false,
            })
            if (user && user.id !== id)
                throw new ConfictError({ message: `This phone no: ${user.phoneNumber} already exist another account.` });
            user = await User.findOneAndUpdate({ id }, { $set: body }, { new: true })

            if (req.file) {
                let fileName = user.id;
                let extension = '.png';
                let path = "user";
                const buffer = await sharp(req.file.buffer)
                    .png({ quality: 100, progressive: true })
                    .toBuffer();
                const location = await imageUpload.uploadFile(buffer, fileName, path, extension)
                let imageLocation = {
                    location: location,
                    lastUpdatedAt: new Date()
                }
                user.imagePath(imageLocation);
            }
            return user;
        }
        catch (err) {
            if (err.status === 404 || err.status === 409)
                return err;
            else
                throw new InternalServerError({ message: 'error in editing', data: err })
        }
    }

    async generateOTP(user) {
        try {
            let momentTime = moment.tz("Asia/Karachi").format();
            var otp = await createPin()

            user.OTP = user.OTP.concat({
                code: otp,
                expireIn: 2,
                generatedAt: momentTime
            });
            let text = `Your verification code is: ${otp}`
            const emailService = await new EmailService().sendEmailInvite(otp, user, "otp", "OTPSend");
            await sendSMS(text, user.phoneNumber)
            await user.save();
            return otp;
        }
        catch (err) {
            return err;
        }
    }
    async verifyOTP(user, otp) {
        console.log("tet", user.OTP[user.OTP.length - 1])
        try {
            const { generatedAt, expireIn, code } = user.OTP[user.OTP.length - 1];
            console.log("Verfied", generatedAt, expireIn, code)
            let generatedTime = moment(generatedAt).format();

            console.log("date from db: ", generatedTime);

            let minuteDifference = moment().diff(generatedTime, 'minutes');
            console.log("difference in minutes: ", minuteDifference);
            if (minuteDifference >= Number(expireIn)) {
                throw new UnauthorizedError({ message: "OTP has been expired" });
            }

            const isMatch = code == otp ? true : false
            if (!isMatch) {
                throw new UnauthorizedError({ message: "OTP has doesn`t match" });
            }
            user.OTP[user.OTP.length - 1].isValidate = true;
            user.OTP[user.OTP.length - 1].validatedAt = new Date();
            await user.save();
            const token = await user.setJWT()
            const response = await userReponse(user)
            response.token = token;
            return response;

        }
        catch (err) {
            return err;
        }
    }






    async userDetail(req, value) {
        const { id } = req.params;
        const data = await User.findOne({ id: id, isDelete: false })
        if (!data) {
            throw new NotFoundError({ message: `User is not available by this id: ${id}` });
        }
        data[value] = !data[value]
        await data.save();
        return data;
    }

    async getOneUser(id) {
        try {
            const user = await User.findOne({ id: id, isDelete: false });
            if (!user) {
                throw new NotFoundError({ message: `User is not available by this id: ${id}` });
            }
            return user;
        }
        catch (err) {
            return err;
        }

    }


}


module.exports = UserService;
