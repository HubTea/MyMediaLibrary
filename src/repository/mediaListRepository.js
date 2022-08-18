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
            }],
            [sequelize.Op.and]: createTagConditionList(tagList)
        },
        include: [{
            model: serverConfig.model.User,
            as: 'Uploader',
            attributes: ['id', 'nickname', 'uuid']
        }],
        order: [
            ['createdAt', 'DESC'],
            ['random', 'ASC']
        ],
        limit: length
    });
}

function getDateAscendingMediaList(earliestDate, random, tagList, length){
    return getAllMedia({
        where: {
            [sequelize.Op.or]: [{
                createdAt: {
                    [sequelize.Op.gt]: earliestDate
                }
            }, {
                createdAt: {
                    [sequelize.Op.eq]: earliestDate
                },
                random: {
                    [sequelize.Op.gte]: random
                }
            }],
            [sequelize.Op.and]: createTagConditionList(tagList)
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
            [sequelize.Op.or]: [{
                viewCount: {
                    [sequelize.Op.lt]: viewCount
                }
            }, {
                viewCount: {
                    [sequelize.Op.eq]: viewCount
                },
                random: {
                    [sequelize.Op.gte]: random
                }
            }],
            [sequelize.Op.and]: createTagConditionList(tagList)
        },
        include: [{
            model: serverConfig.model.User,
            as: 'Uploader',
            attributes: ['id', 'nickname', 'uuid']
        }],
        order: [
            ['viewCount', 'DESC'],
            ['random', 'ASC']
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
            ['createdAt', 'DESC'],
            ['random', 'ASC']
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