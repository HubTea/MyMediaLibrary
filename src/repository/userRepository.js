const sequelize = require('sequelize');

const serverConfig = require('../serverConfig');
const error = require('../error');
const converter = require('./converter');


class UserEntity{
    constructor(){
        this.user = null;
    }

    /**
     * 
     * @param {string} uuid 
     * @returns {Promise<object>} user value object
     */
    async getUserByUuid(uuid){
        this.user = await getOneUser({
            where: {
                uuid: uuid
            }
        });

        return converter.userToValueObject(this.user);
    }

    /**
     * 
     * @param {string} accountId 
     * @returns {Promise<object>} user value object
     */
    async getUserByAccountId(accountId){
        this.user = await getOneUser({
            where: {
                accountId: accountId
            }
        });

        return converter.userToValueObject(this.user);
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
    async createUser(userSeed){
        try{
            let user = converter.userSeedToUser(userSeed);

            this.user = await serverConfig.model.User.build(user).save();
            return converter.userToValueObject(this.user);
        }
        catch(userCreateError){
            throw wrapUserCreateError(userCreateError);
        }
    }   
    
    async beginNicknameUpdate(userValueObject, transaction) {
        let queueId = userValueObject.id % serverConfig.nicknameLogConcurrency;
        let queue = await serverConfig.model.NicknameLogQueue.findOne({
            where: {
                id: queueId
            },
            transaction,
            lock: sequelize.Transaction.LOCK.UPDATE
        });

        let user = await getOneUser({
            where: {
                id: userValueObject.id
            },
            transaction
        });

        let elapsedTime = Date.now() - user.previousNicknameUpdate.getTime();
        if(elapsedTime < serverConfig.nicknameUpdateInterval) {
            throw new error.EarlyNicknameUpdate(null);
        }

        await serverConfig.model.NicknameLogQueue.update({
            offset: queue.offset + 1
        }, {
            where: {
                id: queueId
            },
            transaction
        });

        await serverConfig.model.User.update({
            nickname: userValueObject.nickname,
            introduction: userValueObject.introduction,
            previousNicknameUpdate: new Date()
        }, {
            where: {
                id: userValueObject.id
            },
            transaction
        })

        await serverConfig.model.NicknameLog.create({
            queueId: queueId,
            id: queue.offset,
            userId: userValueObject.id,
            newNickname: userValueObject.nickname
        }, {
            transaction
        });
    }

    async updateUser(userValueObject){
        try{
            await serverConfig.sequelize.transaction(this.beginNicknameUpdate.bind(this, userValueObject));
        }
        catch(userUpdateError){
            throw error.wrapSequelizeError(userUpdateError);
        }
    }
}

function wrapUserCreateError(userCreationError){
    if(userCreationError instanceof sequelize.UniqueConstraintError){
        return new error.UserAlreadyExistError(userCreationError);
    }
    else{
        return error.wrapSequelizeError(userCreationError);
    }
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
    
        return user;
    }
    catch(userFindError){
        throw error.wrapSequelizeError(userFindError);
    }
}


module.exports = {
    UserEntity,

    getOneUser
};