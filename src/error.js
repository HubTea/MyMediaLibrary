const sequelize = require('sequelize');


class ErrorResponse extends Error{
    constructor(httpStatusCode, errorCode, underlyingError){
        super();
        this.httpStatusCode = httpStatusCode;
        this.errorCode = errorCode;
        this.underlyingError = underlyingError;
    }

    evaluateMessage(){

    }
}


class JwtSignFailedError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'TOKEN_SIGN_FAILED', underlyingError);
    }
}


class InvalidJwtError extends ErrorResponse{
    constructor(underlyingError){
        super(403, 'INVALID_TOKEN', underlyingError);
    }
}


class PasswordNotMatchError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'WRONG_PASSWORD', underlyingError);
    }
}


class UserNotExistError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'USER_NOT_EXIST', underlyingError);
    }
}


class UserAlreadyExistError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'USER_ALREADY_EXIST', underlyingError);
    }
}


class IllegalAccountPasswordError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'ILLEGAL_ACCOUNT_PASSWORD', underlyingError);
    }
}


class IllegalAccountIdError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'ILLEGAL_ACCOUNT_ID', underlyingError);
    }
}


class DatabaseError extends ErrorResponse{
    constructor(underlyingError){
        super(500, 'QUERY_FAILED_ERROR', underlyingError);
    }

}


class OmittedParameterError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'PARAMETER_OMITTED', underlyingError);

        this.parameter = [];
    }

    appendParameter(name){
        this.parameter.push(name);
        this.evaluateMessage();
    }

    evaluateMessage(){
        this.message = `생략된 파라미터: ${this.parameter.toString()}`;
    }
}


class NotFoundError extends ErrorResponse{
    constructor(underlyingError){
        super(404, 'NOT_FOUND', underlyingError);
    }
}


class FileStorageError extends ErrorResponse{
    constructor(underlyingError){
        super(500, 'STORAGE_ERROR', underlyingError);
    }
}

class NotPreparedError extends ErrorResponse{
    constructor(){
        super(500, 'NOT_PREPARED', null);
    }
}

class InternalError extends ErrorResponse{
    constructor(underlyingError){
        super(500, 'INTERNAL_ERROR', underlyingError);
    }
}


class UnexpectedError extends ErrorResponse{
    constructor(underlyingError){
        super(500, 'UNEXPECTED_ERROR', underlyingError);
    }
}


function wrapSequelizeError(err){
    if(err instanceof sequelize.BaseError){
        return new DatabaseError(err);
    }
    else{
        return err;
    }
}

module.exports = {
    ErrorResponse,
    JwtSignFailedError,
    InvalidJwtError,
    PasswordNotMatchError,
    UserNotExistError,
    UserAlreadyExistError,
    IllegalAccountIdError,
    IllegalAccountPasswordError,
    DatabaseError,
    OmittedParameterError,
    InternalError,
    UnexpectedError,
    NotFoundError,
    FileStorageError,
    NotPreparedError,

    wrapSequelizeError
};