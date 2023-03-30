const notificationType = Object.freeze({
    USER_CREATED: "user-created",
    CUSTOMER_SUPPORT: "customer-support",
    JOB_REQUEST: "job-request",
    JOB_ACCEPT: "job-accept",
    JOB_CONSUMER_CANCEL: "job-consumer-cancel",
    JOB_SUPPLIER_CANCEL: "job-supplier-cancel",
    JOB_SUPPLIER_ARRIVED: "job-supplier-arrived",
    JOB_DECLINED: "job-declined",
    JOB_COMPLETED: "job-completed",
})

module.exports = notificationType;