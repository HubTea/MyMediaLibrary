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


function getDateDescendingMediaList(latestDate, random, tagList, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."createdAt", "Media"."random") <= 
                    ('${latestDate.toISOString()}', ${random})
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
            ['random', 'DESC']
        ],
        limit: length
    });
}

function getDateAscendingMediaList(earliestDate, random, tagList, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."createdAt", "Media"."random") >= 
                    ('${earliestDate.toISOString()}', ${random})
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
            ['random', 'ASC']
        ],
        limit: length
    });
}

function getViewCountDescendingMediaList(viewCount, random, tagList, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."viewCount", "Media"."random") <= 
                    (${viewCount}, ${random})
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
            ['random', 'DESC']
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

function getLatestUploadList(userId, latestDate, random, length){
    return getAllMedia({
        where: {
            [sequelize.Op.and]: [
                sequelize.literal(
                    `
                    ("Media"."createdAt", "Media"."random") <= 
                    ('${latestDate.toISOString()}', ${random})
                    `
                ), {
                    uploaderId: userId
                }
            ]
        },
        order: [
            ['createdAt', 'DESC'],
            ['random', 'DESC']
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