const sequelize = require('sequelize');

const serverConfig = require('../serverConfig');
const error = require('../error');

async function getAllMedia(option){
    try{
        let list = await serverConfig.model.Media.findAll(option);
        
        return list;
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}

async function getBookmarkList(userId, key, length){
    
}

async function searchMedia(sort, cursor, key, length, tagList){

}

async function getLatestUploadList(userId, latestDate, random, length){
    try{
        let list = await serverConfig.model.Media.findAll({
            where: {
                uploaderId: userId,
                [sequelize.Op.or]: [{
                    updateTime: {
                        [sequelize.Op.lt]: latestDate
                    }
                }, {
                    updateTime: {
                        [sequelize.Op.eq]: latestDate
                    },
                    random: {
                        [sequelize.Op.gte]: random
                    }
                }]
            },
            order: [
                ['updateTime', 'DESC'],
                ['random', 'ASC']
            ],
            limit: length
        });

        return list;
    }
    catch(err){
        throw new error.wrapSequelizeError(err);
    }
}

module.exports = {
    getLatestUploadList
};