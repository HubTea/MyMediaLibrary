const error = require('./error');


function handleError(res, err){
    if(!(err instanceof error.ErrorResponse)){
        err = new error.UnexpectedError(err);
    }
    
    console.error(err);

    res.status(err.httpStatusCode);
    res.write(JSON.stringify({
        error: {
            code: err.errorCode
        }
    }));
    res.end();
}


module.exports = {
    handleError
};