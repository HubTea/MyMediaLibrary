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
        let exception = new error.OmittedParameterError();
        exception.appendParameter('Authorization 헤더');
        throw exception;
    }

    let jwtVerifier = new security.JwtVerifier();
    let key = security.key.hmac;
    let option = security.jwtOption;
    let payload = await jwtVerifier.verify(token, key, option);

    return new authorizer.Authorizer(payload.authorizer);
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

function checkPlaintext(text, parameterName){
    if(typeof text !== 'string'){
        throw new error.IllegalParameter(null, parameterName);
    }

    let endCharacterList = ['a', 'z', 'A', 'Z', '0', '9', ' '];
    let [a, z, A, Z, zero, nine, space] = endCharacterList.map(x => x.charCodeAt(0));
    let allowed = {};

    for(let i = a; i <= z; i++){
        allowed[i] = true;
    }

    for(let i = A; i <= Z; i++){
        allowed[i] = true;
    }

    for(let i = zero; i <= nine; i++){
        allowed[i] = true;
    }

    allowed[space] = true;

    for(let character of text){
        if(!allowed[character.charCodeAt(0)]){
            throw new error.IllegalParameter(null, parameterName);
        }
    }

    return text;
}

function checkMimeType(type, parameterName){
    let allowed = ['image/png', 'image/jpeg', 'video/mp4'];

    if(allowed.indexOf(type) === -1){
        throw new error.IllegalParameter(null, parameterName);
    }

    return type;
}

function checkAccountId(accountId, parameterName){
    if(!accountId){
        let exception = new error.OmittedParameterError();

        exception.appendParameter(parameterName);
        throw exception;
    }

    if(accountId.length > 30){
        throw new error.IllegalParameter(null, parameterName);
    }

    checkPlaintext(accountId, parameterName);

    return accountId;
}

function checkAccountPassword(password, parameterName){
    if(!password){
        let exception = new error.OmittedParameterError();

        exception.appendParameter(parameterName);
        throw exception;
    }

    if(password.length < 12 || password.length > 30){
        throw new error.IllegalParameter(null, parameterName);
    }

    checkPlaintext(password, parameterName);

    return password;
}

function checkTagList(tagList, parameterName){
    if(!Array.isArray(tagList)){
        return [];
    }

    if(tagList.length > 10){
        throw new error.IllegalParameter(null, parameterName);
    }

    for(let tag of tagList){
        checkPlaintext(tag, parameterName);
        
        if(tag.length > 20){
            throw new error.IllegalParameter(null, parameterName);
        }
    }

    return tagList;
}

module.exports = {
    checkAuthorizationHeader,
    checkUserAuthorization,
    checkMediaAuthorization,
    checkUuid,
    checkPaginationLength,
    checkDateRandomCursor,
    checkDateOrderCursor,
    checkOrderCursor,
    checkPlaintext,
    checkMimeType,
    checkAccountId,
    checkAccountPassword,
    checkTagList
};