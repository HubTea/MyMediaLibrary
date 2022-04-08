

class ErrorResponse{
    constructor(httpErrorCode, errorCode, underlyingError){
        this.httpErrorCode = httpErrorCode;
        this.errorCode = errorCode;
        this.underlyingError = underlyingError;
    }
}


class InvalidJwtError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'INVALID_TOKEN', underlyingError);
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


module.exports = {
    ErrorResponse,
    InvalidJwtError,
    PasswordNotMatchError,
    UserNotExistError,
    IllegalAccountIdError,
    IllegalAccountPasswordError
};