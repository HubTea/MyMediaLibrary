function mediaValueObjectToMedia(mediaValueObject){
    return {
        title: mediaValueObject.title,
        description: mediaValueObject.description,
        type: mediaValueObject.type,
        updateTime: mediaValueObject.updateTime
    };
}   

function mediaToValueObject(media){
    return {
        id: media.id,
        uuid: media.uuid,
        title: media.title,
        description: media.description,
        type: media.type,
        uploaderId: media.uploaderId,
        updateTime: media.updateTime
    };
}


function userSeedToUser(userSeed){
    return {
        accountId: userSeed.accountId,
        nickname: userSeed.nickname,
        accountPasswordHash: userSeed.hash,
        accountPasswordSalt: userSeed.salt
    };
}

function userValueObjectToUser(userValueObject){
    return {
        accountId: userValueObject.accountId,
        nickname: userValueObject.nickname,
        introduction: userValueObject.introduction
    };
}

/**
 * 
 * @param {User} user 
 * @returns {object} user value object
 * ```
 * {
 *  id: number
 *  uuid: string,
 *  accountId: string,
 *  nickname: string,
 *  introduction: string
 * }
 * ```
 */
function userToValueObject(user){
    return {
        id: user.id,
        uuid: user.uuid,
        accountId: user.accountId,
        nickname: user.nickname,
        introduction: user.introduction
    };
}

module.exports = {
    userToValueObject,
    userValueObjectToUser,
    userSeedToUser,
    mediaToValueObject,
    mediaValueObjectToMedia
};