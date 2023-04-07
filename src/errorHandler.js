const error = require('./error');
const serverConfig = require('./serverConfig');


function handleError(req, res, err){
    let level = 'info';

    if(!(err instanceof error.ErrorResponse)){
        err = new error.UnexpectedError(err);
        level = 'error';
    }
    
    serverConfig.logger.log({
        level: level, 
        message: {
            method: req.method,
            url: req.originalUrl,
            header: req.headers,
            body: req.body,
            error: err
        }
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