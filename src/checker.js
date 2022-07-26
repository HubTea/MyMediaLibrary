const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const security = require('./securityService');
const errorHandler = require('./errorHandler');
const error = require('./error');
const authorizer = require('./authorizer');
const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');
const pagination = require('./pagination');


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

/**
 * 
 * @param {string} id uuid
 * @param {string} parameterName 
 */
function checkUuid(id, parameterName){
    if(uuid.validate(id)){
        return id;
    }
    else{
        throw new error.IllegalParameter(null, parameterName);
    }
}

/**
 * 
 * @param {string} length 
 * @return {number} parsed length
 */
function checkPaginationLength(length, parameterName){
    if(length === undefined){
        return pagination.defaultLength;
    }

    let parsed = parseInt(length);

    if(isNaN(parsed)){
        throw new error.IllegalParameter(null, parameterName);
    }
    
    if(parsed < pagination.minimumLength){
        parsed = pagination.minimumLength;
    }
    else if(parsed > pagination.maximumLength){
        parsed = pagination.maximumLength;
    }

    return parsed;
}

/**
 * 
 * @param {string} cursor 정수_정수 형식의 문자열
 * @param {string} delimiter 
 * @param {string} parameterName 현재 검사중인 파라미터의 이름. 에러 메시지에 사용.
 * @returns 
 */
function checkTwoIntCursor(cursor, delimiter, parameterName){
    let splitted = cursor.split(delimiter);

    if(isNaN(splitted[0]) || isNaN(splitted[1])){
        throw new error.IllegalParameter(null, parameterName);
    }

    return splitted;
}

/**
 * 
 * @param {string} cursor 정수_정수 형식의 문자열
 * @param {string} delimiter 
 * @param {string} parameterName 현재 검사중인 파라미터의 이름. 에러 메시지에 사용.
 * @returns 
 */
 function checkDateIntCursor(cursor, delimiter, parameterName){
    let splitted = checkTwoIntCursor(cursor, delimiter, parameterName);

    return [
        new Date().setTime(splitted[0]), 
        splitted[1]
    ];
}

/**
 * 
 * @param {string | undefined} cursor 정수_정수 형식의 문자열
 * @param {string} delimiter 
 * @param {Date} defaultDate cursor가 undefined일 경우에 사용할 기본값
 * @param {string} parameterName 현재 검사중인 파라미터의 이름. 에러 메시지에 사용.
 * @returns [Date, number] 배열
 */
function checkDateRandomCursor(cursor, delimiter, defaultDate, parameterName){
    if(cursor){
        return checkDateIntCursor(cursor, delimiter, parameterName);
    }
    else{
        return [defaultDate, pagination.minimumRandom];
    }
}

/**
 * 
 * @param {string | undefined} cursor 정수_정수 형식의 문자열
 * @param {string} delimiter 
 * @param {Date} defaultDate 
 * @param {number} defaultOrder 
 * @param {string} parameterName 현재 검사중인 파라미터의 이름. 에러 메시지에 사용.
 * @returns 
 */
function checkDateOrderCursor(cursor, delimiter, defaultDate, defaultOrder, parameterName){
    if(cursor){
        return checkDateIntCursor(cursor, delimiter, parameterName);
    }
    else{
        return [defaultDate, defaultOrder];
    }
}

function checkOrderCursor(cursor, defaultOrder, parameterName){
    if(cursor){
        let parsed = parseInt(cursor);

        if(isNaN(parsed)){
            throw new error.IllegalParameter(null, parameterName);
        }

        return parsed;
    }
    else{
        return defaultOrder;
    }
}


module.exports = {
    checkAuthorizationHeader,
    checkUserAuthorization,
    checkMediaAuthorization,
    checkUuid,
    checkPaginationLength,
    checkDateRandomCursor,
    checkDateOrderCursor,
    checkOrderCursor
};