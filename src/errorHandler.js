const error = require('./error');
const serverConfig = require('./serverConfig');


function handleError(res, err, {method, originalUrl, headers, body}){
    let level = 'info';

    if(!(err instanceof error.ErrorResponse)){
        err = new error.UnexpectedError(err);
        level = 'error';
    }
    
    serverConfig.logger.log({
        level: level, 
        message: {
            method: method,
            url: originalUrl,
            header: headers,
            body: body,
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

function filter(obj, property) {
    let deepCopy = JSON.parse(JSON.stringify(obj));

    delete deepCopy[property];
    return deepCopy;
}

function filterRequest(req) {
    return {
        method: req.method,
        originalUrl: req.originalUrl,
        headers: filter(filter(req.headers, 'Authorization'), 'authorization'),
        body: filter(req.body, 'accountPassword')
    };
}


module.exports = {
    handleError,
    filterRequest,
    filter
};