class NotFoundError extends Error {
    constructor(message,data) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 404;
      this.data = data;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  class ConfictError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 409;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  class BadRequestError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 400;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  class InternalServerError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 500;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  class UnauthorizedError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 401;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  // A 403 error response indicates that the client’s request is formed correctly,
  //  but the REST API refuses to honor it, i.e. the user does not have 
  //  the necessary permissions for the resource. A 403 response is not a 
  //  case of insufficient client credentials; that would be 401 (“Unauthorized”).
  class ForbiddenError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 403;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  // The 406 error response indicates that the API is not able to 
  // generate any of the client’ s preferred media types, 
  // as indicated by the Accept request header.For example, a client request
  // for data formatted as application / xml will receive a 406 response
  // if the API is only willing to format data as application / json.
  class NotAcceptableError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 406;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  // The 412 error response indicates that the client specified one or more 
  // preconditions in its request headers, effectively telling the 
  // REST API to carry out its request only
  // if certain conditions were met.A 412 response indicates that 
  // those conditions were not met, so instead of carrying out the request,
  //  the API sends this status code.
  class PreconditionFailedError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 412;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class AlreadyReportedError extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 208;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class UnprocessableEntity extends Error {
    constructor(message) {
      super(message);
      this.messageText = message;
      this.name = this.constructor.name;
      this.status = 422;
      this.data = null;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = {
    NotFoundError,
    BadRequestError,
    ConfictError,
    InternalServerError,
    UnauthorizedError,
    ForbiddenError,
    NotAcceptableError,
    PreconditionFailedError,
    AlreadyReportedError,
    UnprocessableEntity
  };