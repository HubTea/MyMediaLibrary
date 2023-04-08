const sequelize = require('sequelize');

const serverConfig = require('../serverConfig');
const error = require('../error');
const tagManipulator = require('../tag');

async function getAllMedia(option){
    try{
        let list = await serverConfig.model.Media.findAll(option);
        
        return list;
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}


function getDateDescendingMediaList(latestDate, uuid, tagList, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."createdAt", "Media"."uuid") <= 
                    ('${latestDate.toISOString()}', '${uuid}')
                    `
                ), {
                    [sequelize.Op.and]: createTagConditionList(tagList)
                }
            ]
        },
        include: [{
            model: serverConfig.model.User,
            as: 'Uploader',
            attributes: ['id', 'nickname', 'uuid']
        }],
        order: [
            ['createdAt', 'DESC'],
            ['uuid', 'DESC']
        ],
        limit: length
    });
}

function getDateAscendingMediaList(earliestDate, uuid, tagList, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."createdAt", "Media"."uuid") >= 
                    ('${earliestDate.toISOString()}', '${uuid}')
                    `
                ), {
                    [sequelize.Op.and]: createTagConditionList(tagList)
                }
            ]
        },
        include: [{
            model: serverConfig.model.User,
            as: 'Uploader',
            attributes: ['id', 'nickname', 'uuid']
        }],
        order: [
            ['createdAt', 'ASC'],
            ['uuid', 'ASC']
        ],
        limit: length
    });
}

function getViewCountDescendingMediaList(viewCount, uuid, tagList, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."viewCount", "Media"."uuid") <= 
                    (${viewCount}, '${uuid}')
                    `
                ), {
                    [sequelize.Op.and]: createTagConditionList(tagList)
                }
            ]
        },
        include: [{
            model: serverConfig.model.User,
            as: 'Uploader',
            attributes: ['id', 'nickname', 'uuid']
        }],
        order: [
            ['viewCount', 'DESC'],
            ['uuid', 'DESC']
        ],
        limit: length
    });
}

function createTagConditionList(tagList){
    let conditionList = [];

    for(let tag of tagList){
        let enclosedTag = tagManipulator.concatenateTagList([tag]);

        conditionList.push({
            tagString: {
                [sequelize.Op.like]: `%${enclosedTag}%`
            }
        });
    }

    return conditionList;
}

function getLatestUploadList(userId, latestDate, uuid, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."createdAt", "Media"."uuid") <= 
                    ('${latestDate.toISOString()}', '${uuid}')
                    `
                ), {
                    uploaderId: userId
                }
            ]
        },
        order: [
            ['createdAt', 'DESC'],
            ['uuid', 'DESC']
        ],
        limit: length
    });
}

module.exports = {
    getDateDescendingMediaList,
    getDateAscendingMediaList,
    getViewCountDescendingMediaList,
    getLatestUploadList
};