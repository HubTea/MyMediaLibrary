const jwt = require('jsonwebtoken');

const security = require('./securityService');
const errorHandler = require('./errorHandler');
const error = require('./error');
const authorizer = require('./authorizer');
const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');


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

function checkUserAuthorization(authorizer, userUuid){
    if(!authorizer.testUserAccessibility(userUuid)){
        throw new error.InvalidJwtError(null);
    }
}

async function checkMediaAuthorization(authorizer, mediaUuid){
    if(!authorizer.testMediaAccessibility(mediaUuid)){
        throw new error.InvalidJwtError(null);
    }

    let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
    let media = await mediaEntity.getMetadataWithUploader();

    checkUserAuthorization(authorizer, media.uploader.uuid);
}

module.exports = {
    checkAuthorizationHeader,
    checkUserAuthorization,
    checkMediaAuthorization
};