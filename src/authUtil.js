const jwt = require('jsonwebtoken');
const serverConfig = require('./serverConfig');
const error = require('./error');


async function getAuthorizer(req){
    const authHeader = req.get('Authorization');
    
    return new Promise(function(resolve, reject){
        jwt.verify(authHeader, serverConfig.key.public, function(err, payload){
            if(err){
                reject(new error.InvalidJwtError(err));
                return;
            }
            else{
                resolve(payload);
                return;
            }
        });
    });
}


module.exports = {
    getAuthorizer
};