const sequelize = require('sequelize');

const serverConfig = require('../serverConfig');
const error = require('../error');


/**
 * 
 * @param {string} userId 
 * @returns {Promise<object>} user value object
 */
async function getUserByUserId(userId){
    return await getOneUser({
        where: {
            userId: userId
        }
    });
}

/**
 * 
 * @param {string} accountId 
 * @returns {Promise<object>} user value object
 */
async function getUserByAccountId(accountId){
    return await getOneUser({
        where: {
            accountId: accountId
        }
    });
}

/**
 * 
 * @param {object} queryOption sequelize의 findOne 메소드에 전달할 인자
 * @returns {Promise<object>} user value object
 */
async function getOneUser(queryOption){
    try{
        let user = await serverConfig.model.User.findOne(queryOption);

        if(user === null){
            throw new error.UserNotExistError(null);
        }
    
        return userToValueObject(user);
    }
    catch(userFindError){
        throw error.wrapSequelizeError(userFindError);
    }
}

/**
 * 
 * @param {object} userSeed 
 *  ```
 * {
 *  accountId: string,
 *  nickname: string,
 *  hash: string,
 *  salt: string
 * }
 * ```
 * @returns {Promise<object>} user value object
 *
 */
async function createUser(userSeed){
    try{
        let user = userSeedToUser(userSeed);

        user = await user.save();

        return userToValueObject(user);
    }
    catch(userCreateError){
        throw wrapUserCreateError(userCreateError);
    }
}

function userSeedToUser(userSeed){
    return serverConfig.model.User.build({
        accountId: userSeed.accountId,
        nickname: userSeed.nickname,
        accountPasswordHash: userSeed.hash,
        accountPasswordSalt: userSeed.salt
    });
}

function wrapUserCreateError(userCreationError){
    if(userCreationError instanceof sequelize.UniqueConstraintError){
        return new error.UserAlreadyExistError(userCreationError);
    }
    else{
        return error.wrapSequelizeError(userCreationError);
    }
}

async function setUser(userValueObject){
    try{
        let user = userValueObjectToUser(userValueObject);

        let updateResult = await serverConfig.model.User.update({
            accountId: user.accountId,
            nickname: user.nickname,
            introduction: user.introduction,
            thumbnailUrl: user.thumbnailUrl,
            accountPasswordHash: user.accountPasswordHash,
            accountPasswordSalt: user.accountPasswordSalt
        }, {
            where: {
                userId: userValueObject.userId
            }
        });

        return userValueObject;
    }
    catch(userUpdateError){
        throw error.wrapSequelizeError(userUpdateError);
    }
}

function userValueObjectToUser(userValueObject){
    return serverConfig.model.User.build({
        userId: userValueObject.userId,
        accountId: userValueObject.accountId,
        nickname: userValueObject.nickname,
        introduction: userValueObject.introduction,
        thumbnailUrl: userValueObject.thumbnailUrl,
        accountPasswordHash: userValueObject.hash,
        accountPasswordSalt: userValueObject.salt
    });
}

/**
 * 
 * @param {User} user 
 * @returns {object} user value object
 * ```
 * {
 *  userId: string,
 *  accountId: string,
 *  nickname: string,
 *  introduction: string,
 *  thumbnailUrl: string,
 *  hash: string,
 *  salt: string
 * }
 * ```
 */
 function userToValueObject(user){
    return {
        userId: user.userId,
        accountId: user.accountId,
        nickname: user.nickname,
        introduction: user.introduction,
        thumbnailUrl: user.thumbnailUrl,
        hash: user.accountPasswordHash,
        salt: user.accountPasswordSalt
    };
}

module.exports = {
    getUserByUserId,
    getUserByAccountId,

    createUser,

    setUser
};