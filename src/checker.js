const jwt = require('jsonwebtoken');

const security = require('./securityService');
const errorHandler = require('./errorHandler');
const error = require('./error');
const authorizer = require('./authorizer');


/**
 * 
 * @param {*} req 
 * @returns {Promise<authorizer.Authorizer>}
 */
async function checkAuthorizationHeader(req){
    let token = req.get('Authorization');

    if(!token){
        throw new error.OmittedParameterError().appendParameter('Authorization 헤더');
    }

    let payload = await getTokenPayload(token);

    return new authorizer.Authorizer(payload.authorizer);
}

function getTokenPayload(token){
    return new Promise(function(resolve, reject){
        jwt.verify(
            token, security.key.hmac, 
            {
                algorithms: 'HS256'
            }, 
            function(err, decoded){
                if(err){
                    reject(new error.InvalidJwtError(err));
                }

                resolve(decoded);
            }
        );
    });
}

function checkUserAuthorization(authorizer, userId){
    if(!authorizer.testUserAccessibility(userId)){
        throw new error.InvalidJwtError(null);
    }
}

module.exports = {
    checkAuthorizationHeader,
    checkUserAuthorization
};