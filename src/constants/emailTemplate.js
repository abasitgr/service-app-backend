module.exports = Object.freeze({

    'appointmentCreated': {
        template: '../template/sendInvite.ejs',
        subject: 'Appointment created for HomePlug Interview',
    },
    'supplierApproved': {
        template: '../template/approved.ejs',
        subject: 'Approved Supplier!',
    },
    'canceledAppointment': {
        template: '../template/canceled.ejs',
        subject: 'Cancel Appointment!',
    },
    'otp': {
        template: '../template/otp.ejs',
        subject: 'Verify Login',
    },
    'jobInvite': {
        template: '../template/jobInvite.ejs',
        subject: 'Job Invitation',
    },
    'verification': {
        template: '../template/verification.ejs',
        subject: 'Job verification code'
    },
    'weekPayment': {
        template: '../template/weekPayment.ejs',
        subject: 'Week Submission'
    }
})