
const Config = require("../config/email");
const mandrill = require("node-mandrill")(Config.Email.ApiKey);
const EmailTemplate = require("../constants/emailTemplate");
const ejs = require("ejs");
const path = require('path');
const moment = require('moment-timezone');
const { InternalServerError, NotFoundError, ConfictError, ForbiddenError, BadRequestError } = require("../utils/error");
var nodemailer = require('nodemailer');


class EmailService {

    async sendEmailInvite(time, supplierDetail, templateName, from) {
        try {
            console.log("time: ", time)

            let data = {
                name: supplierDetail.name
            }
            if (from === "add") {
                data.appointmentTime = moment(time.appointmentStartTime).subtract(5, "hour").format("MMMM Do YYYY, h:mm:ss a")
            } else if (from === "approved") {
                data.url = `${process.env.PDF_URL}${supplierDetail.id}`
            } else if (from === "OTPSend") {
                data.otp = time
            } else if (from === "verification") {
                console.log("data: ", data);
                data.code = supplierDetail.verificationCode
                data.jobId = supplierDetail.jobId
            } else if (from === "weekPayment") {
                data.payable = supplierDetail.amount
            }
            console.log("Data: ", data)
            const { html, subject } = await this.renderTemplate(templateName, data);
            return await this.sendEmail(subject, html, '', supplierDetail.email, '', []);
        }
        catch (err) {
            console.log("err", err)
        }
    }

    async sendJobInvite(supplierData, jobData) {
        try {
            console.log("invite", supplierData)
            let response;
            for (let i = 0; i < supplierData.length; i++) {
                const { html, subject } = await this.renderTemplate("jobInvite", supplierData[i]);
                response = await this.sendEmail(subject, html, '', [{ email: supplierData[i].email }], '', []);
            }
            return response;
        }
        catch (err) {
            console.log("err", err)
        }
    }

    async renderTemplate(templateName, data) {
        const template = EmailTemplate[templateName]['template'];
        const _subject = EmailTemplate[templateName]['subject'];
        console.log("templateName;;", templateName, data)
        return new Promise((resolve, reject) => {
            ejs.renderFile(path.join(__dirname, template), { data }, (err, html) => {
                if (err) {
                    reject(new InternalServerError(`Error in render ejs template html ${err}`));
                } else {
                    console.log('for check after resolve');
                    resolve({ html: html, subject: _subject });
                }


            })
        })
    }

    async sendEmail(subject, htmlTemplate, text, to, cc, attachments) {
        let _message = {
            to: [{email:to}],
            from_email: Config.Email.From,
            subject: subject,
            tags: [
                subject
            ],
        }


        if (htmlTemplate)
            _message.html = htmlTemplate;

        if (text)
            _message.text = text

        console.log("_message:", _message)

        // const transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //     auth: {
        //         user: Config.Email_NodeMailler.From,
        //         pass: Config.Email_NodeMailler.Pass

        //     }
        // });
        // const mailOptions = {
        //     from: Config.Email_NodeMailler.From,
        //     to: to,
        //     subject: subject,
        //     html: htmlTemplate
        // };

        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.log('Error in sending email', error);
        //     }
        //     console.log('Email sent by Nodemailer ', info);
        //     return info;
        // })

        if (attachments.length > 0) {
            _message.attachments = [];
            const attachmentsOk = await this.verifyAttachments(attachments);
            if (!attachmentsOk) {
                console.log(`Attachment in email is corrupted cannot send email ${attachments.length} attachment`);
                return;
                // throw new Error.InternalServerError(`Attachment in email is corrupted cannot send email ${attachments.length} attachment`);
            } 
            for (let attach of attachments) {
                attach.content = new Buffer(attach.content).toString('base64');
                _message.attachments.push(attach);
            }
        }
        return await new Promise((resolve, reject) => {
            mandrill('/messages/send', {
                message: _message
            }, (error, response) => {
                if (error) {
                    console.log(`Email error`, error);
                    reject(new Error.InternalServerError(`Mandrill send email function error : ${error}`));
                }
                console.log(`email response`, response);
                resolve(`Email sent successfully Response:`);
            });
        })
    }
}
module.exports = EmailService;
