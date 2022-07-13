const error = require('./error');


function handleError(res, err){
    if(!(err instanceof error.ErrorResponse)){
        err = new error.UnexpectedError(err);
    }
    
    let recursiveError = err;

    while(recursiveError){
        console.error(`error code: ${recursiveError.errorCode}`);
        console.error(`message: ${recursiveError.message}`);
        console.error(`stack: ${recursiveError.stack}`);
        console.error(recursiveError.underlyingError);

        recursiveError = recursiveError.underlyingError;
    }
    
    

    res.status(err.httpStatusCode);
    res.write(JSON.stringify({
        error: {
            code: err.errorCode,
            message: err.message
        }
    }));
    res.end();
}


module.exports = {
    handleError
};