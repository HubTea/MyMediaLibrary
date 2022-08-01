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


function getMediaList(latestDate, random, length){
    return getAllMedia({
        where: {
            [sequelize.Op.or]: [{
                createdAt: {
                    [sequelize.Op.lt]: latestDate
                }
            }, {
                createdAt: {
                    [sequelize.Op.eq]: latestDate
                },
                random: {
                    [sequelize.Op.gte]: random
                }
            }]
        },
        include: [{
            model: serverConfig.model.User,
            as: 'Uploader',
            attributes: ['id', 'nickname', 'uuid']
        }],
        order: [
            ['updateTime', 'DESC'],
            ['random', 'ASC']
        ],
        limit: length
    });
}

function getLatestUploadList(userId, latestDate, random, length){
    return getAllMedia({
        where: {
            uploaderId: userId,
            [sequelize.Op.or]: [{
                createdAt: {
                    [sequelize.Op.lt]: latestDate
                }
            }, {
                createdAt: {
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
}

module.exports = {
    getMediaList,
    getLatestUploadList
};