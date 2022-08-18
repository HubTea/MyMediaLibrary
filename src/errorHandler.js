const error = require('./error');
const serverConfig = require('./serverConfig');


function handleError(res, err){
    if(!(err instanceof error.ErrorResponse)){
        err = new error.UnexpectedError(err);
    }
    
    let level = 'info';

    if(err.httpStatusCode >= 500){
        level = 'error';
    }

    serverConfig.logger.log({
        level: level, 
        message: JSON.stringify({
            errorCode: err.errorCode,
            message: err.message,
            stack: err.stack,
            underlyingError: err.underlyingError
        })
    });
    
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