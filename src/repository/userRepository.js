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

    async updateUser(userValueObject){
        try{
            let user = converter.userValueObjectToUser(userValueObject);
            
            if(this.user){
                let updateResult = await this.user.update(user);
            }
            else{
                let updateResult = await serverConfig.model.User.update(user, {
                    where: {
                        id: userValueObject.id
                    }
                });
            }
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