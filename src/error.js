

class ErrorResponse extends Error{
    constructor(httpStatusCode, errorCode, underlyingError){
        super();
        this.httpStatusCode = httpStatusCode;
        this.errorCode = errorCode;
        this.underlyingError = underlyingError;
    }
}


class JwtSignFailedError extends ErrorResponse{
    constructor(underlyingError){
        super(400, 'TOKEN_SIGN_FAILED', underlyingError);
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


module.exports = {
    ErrorResponse,
    JwtSignFailedError,
    InvalidJwtError,
    PasswordNotMatchError,
    UserNotExistError,
    IllegalAccountIdError,
    IllegalAccountPasswordError,
    InternalError,
    UnexpectedError
};