const sequelize = require('sequelize');

const error = require('../error');
const serverConfig = require('../serverConfig');


function getCommentShardModel(mediaId) {
    let shardIndex =  mediaId % serverConfig.commentShardList.length;
    return serverConfig.commentShardModelList[shardIndex];
}

async function getCommentList(option, mediaId){
    try{
        let model = getCommentShardModel(mediaId);
        return await model.Comment.findAll(option);
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}

async function getComment(option, mediaId){
    try{
        let model = getCommentShardModel(mediaId);
        return await model.Comment.findOne(option);
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}

async function getCommentByUuid(uuid, mediaId){
    let comment = await getComment({
        where: {
            uuid: uuid
        }
    }, mediaId);

    return comment.toJSON();
}

/**
 * 댓글에 대한 답글 목록을 작성 날짜의 오름차순으로 반환
 * 각 댓글에는 댓글이 달려있는 미디어에 대한 uuid를 포함
 * @param {Date} date 반환할 댓글 작성 날짜의 하한선
 * @param {number} random 반환할 댓글의 random 컬럼의 하한선
 * @param {number} parentId 부모 댓글의 pk
 * @param {number} length 목록 길이
 */
async function getChildCommentListWithMediaReference(date, random, length, parentId){
    let option = generateDefaultOption(date, random, length);

    option.where.parentUuid = parentId;
    option.include.push({
        model: serverConfig.model.Media,
        as: 'CommentTarget',
        attributes: ['uuid', 'title']
    });

    let list = await getCommentList(option);

    return list.map(x => x.toJSON());
}

/**
 * 유저가 단 댓글 목록을 작성 날짜의 오름차순으로 반환
 * 각 댓글에는 댓글이 달려있는 미디어에 대한 uuid를 포함
 * @param {Date} date 반환할 댓글 작성 날짜의 하한선
 * @param {number} random 반환할 댓글 random 컬럼의 하한선
 * @param {number} writerId 작성 유저의 pk
 * @param {number} length 목록 길이
 */
async function getMyCommentListWithMediaReference(date, random, length, writerId){
    let option = generateDefaultOption(date, random, length);

    option.where.writerId = writerId;
    option.include.push({
        model: serverConfig.model.Media,
        as: 'CommentTarget',
        attributes: ['uuid', 'title']
    });

    let list = await getCommentList(option);

    return list.map(x => x.toJSON());
}

/**
 * 미디어에 달린 댓글의 답글 목록을 작성 날짜의 오름차순으로 반환
 * 각 댓글에는 미디어에 대한 정보가 없음
 * @param {Date} date 
 * @param {number} random 
 * @param {number} length 
 * @param {number} parentId 
 * @param {number} mediaId
 */
async function getChildCommentList(date, random, length, parentId, mediaId){
    let option = generateDefaultOption(date, random, length);

    option.where.parentId = parentId;
    
    let list = await getCommentList(option, mediaId);

    return list.map(x => x.toJSON());
}

/**
 * 미디어에 달린 댓글 목록을 작성 날짜의 오름차순으로 반환
 * 각 댓글에는 미디어에 대한 정보가 없음
 * @param {Date} date 
 * @param {number} random 
 * @param {number} length 
 * @param {number} mediaId 
 */
async function getCommentListOfMedia(date, random, length, mediaId){
    let option = generateDefaultOption(date, random, length);

    option.where.mediaId = mediaId;
    option.where.parentId = {
        [sequelize.Op.is]: null
    };

    let list = await getCommentList(option, mediaId);

    return list.map(x => x.toJSON());
}

function generateDefaultOption(date, random, length){
    return {
        attributes: ['uuid', 'content', 'createdAt', 'updatedAt', 'random', 'writerNickname'],
        where: {
            [sequelize.Op.or]: [{
                createdAt: {
                    [sequelize.Op.gt]: date
                }
            }, {
                createdAt: date,
                random: {
                    [sequelize.Op.gte]: random
                }
            }]
        },
        order: [
            ['createdAt', 'ASC'],
            ['random', 'ASC']
        ],
        limit: length
    };
}

async function confirm(commentId, nickname, mediaId) {
    let model = getCommentShardModel(mediaId);

    try {
        if(nickname === null) {
            await model.Comment.update({
                confirmed: true
            }, {
                where: {
                    id: commentId
                }
            });
        }
        else {
            await model.Comment.update({
                writerNickname: nickname,
                confirmed: true
            }, {
                where: {
                    id: commentId
                }
            });
        }
    }
    catch(err) {
        throw error.wrapSequelizeError(err);
    }
}

module.exports = {
    getCommentByUuid,
    getChildCommentListWithMediaReference,
    getMyCommentListWithMediaReference,
    getChildCommentList,
    getCommentListOfMedia,
    getCommentShardModel,
    confirm
};
