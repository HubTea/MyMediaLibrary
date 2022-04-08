
class ErrorResponse{
    /**
     * 예외 발생 시 던져진 예외 객체외 더불어 추가적인 정보를 담아서 다시 던져지는 객체
     * @param {number} httpErrorCode 응답으로 전달될 HTTP 상태 코드
     * @param {object} errorCode 
     *      에러 종류를 나타내는 ENUM값이자 함수. 
     *      ErrorResponse의 정적 멤버를 가리킴
     * @param {string} message 에러에 대한 구체적인 설명
     * @param {object} underlyingError 원인이 되는 err 객체
     */
    constructor(httpErrorCode, errorCode, message, underlyingError){
        this.httpErrorCode = httpErrorCode;
        this.errorCode = errorCode;
        this.message = message;
        this.underlyingError = underlyingError;
    }

    getHttpErrorCode(){
        return this.httpErrorCode;
    }

    getErrorCode(){
        return this.errorCode;
    }

    getMessage(){
        return this.message;
    }

    getUnderlyingError(){
        return this.underlyingError;
    }

    static USER_NOT_EXIST(){
        return 'USER_NOT_EXIST';
    }

    static WRONG_PASSWORD(){
        return 'WRONG_PASSWORD';
    }

    static UNAUTHORIZED_REQUEST(){
        return 'UNAUTHORIZED_REQUEST';
    }

    static INTERNAL_ERROR(){
        return 'INTERNAL_ERROR';
    }
}


exports.ErrorResponse = ErrorResponse;