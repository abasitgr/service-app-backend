var CronJob = require('cron').CronJob;
const EmailService = require("../service/email.service");
const WalletService = require("../service/wallet.service");
const SupplierService = require("../service/supplier.service");


module.exports = {

    batchTesting: async () => {

        const walletService = await new WalletService();
        const walletData = await walletService.getAllSupplier('none', 'batch');
        var job = new CronJob('00 12 * * thu', async () => {
            console.log(`Batch in every 1 Minute ${new Date()}`);
            if (walletData.walletDetail.data.length > 0) {
                let newData = await walletData.walletDetail.data.forEach(async (supplier) => {
                    const supplierDetail = await new SupplierService().getSupplierDetail(supplier._id);
                    const amount = await walletService.getWeekSubmission(supplierDetail);
                    let emailDetail = {
                        name: supplierDetail.name,
                        email: supplierDetail.email,
                        amount: amount[0].payable
                    }
                    console.log("emailData", emailDetail)
                    const emailService = await new EmailService().sendEmailInvite("", emailDetail, "weekPayment", "weekPayment");
                });
            }
        }, null, true,);
        job.start();



        // let emailDetail = {
        //     verificationCode: 1234,
        //     email: "muhammadyousuf327@gmail.com",
        //     name: "Yousuf",
        //     jobId: `Testing Batch emails, email sent at ${new Date()}`
        // }
        // console.log("emailDetail: ", emailDetail)

        // var job = new CronJob('1 * * * * *', async () => {
        //     console.log(`message in every 5 second ${new Date()}`);
        // }, null, true, 'America/Los_Angeles');
        // job.start();
    }

};