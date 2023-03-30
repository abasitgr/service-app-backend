const jobStatus = Object.freeze({
    REQUEST: "request",
    ACCEPT: "accept",
    ARRIVED: "arrived",
    START: "start",
    IN_PROGRESS: "in-progress",
    PENDING: "pending",
    RESTART: "restart",
    COMPLETED: "completed",
    CANCEL: "cancel",
    PATNER_CANCEL: "partner-cancel",
    DECLINE:"decline"
})

module.exports = jobStatus;