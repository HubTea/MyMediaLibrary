const express = require('express');
const stream = require('stream/promises');
const sequelize = require('sequelize');

const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');
const checker = require('./checker');
const errorHandler = require('./errorhandler');
const serverConfig = require('./serverConfig');


const mediaRouter = express.Router();

mediaRouter.get('/', function(req, res){

});

mediaRouter.get('/:mediaUuid/info', async function(req, res){
    try{
        let mediaUuid = req.params.mediaUuid;
        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        
        await mediaEntity.addViewCount(1);

        let mediaValueObject = await mediaEntity.getMetadataWithUploader();
        let viewCount = await mediaEntity.getViewCount();
        let dislikeCount = await mediaEntity.getDislikeCount();
        
        res.status(200);
        res.set('Content-Type', 'application/json');
        res.write(JSON.stringify({
            title: mediaValueObject.title,
            description: mediaValueObject.description,
            type: mediaValueObject.type,
            updateTime: mediaValueObject.updateTime,
            viewCount: viewCount,
            dislikeCount: dislikeCount,
            uploader: {
                uuid: mediaValueObject.uploader.uuid,
                nickname: mediaValueObject.uploader.nickname
            }
        }));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.get('/:mediaUuid', async function(req, res){
    try{
        let mediaUuid = req.params.mediaUuid;
        let entity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        let download = await entity.getDownloadStream();
        let mediaValueObject = await entity.getMetadata();

        res.set('Content-Type', mediaValueObject.type);
        await stream.pipeline(download, res);
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.post('/:mediaUuid', async function(req, res){
    try{
        let mediaUuid = req.params.mediaUuid;
        let authorizer = await checker.checkAuthorizationHeader(req);

        await checker.checkMediaAuthorization(authorizer, mediaUuid);

        let entity = mediaRepository.MediaEntity.fromUuid(mediaUuid);

        await entity.upload(req);

        res.status(200);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.get('/:mediaUuid/comments', async function(req, res){
    let mediaUuid = req.params.mediaUuid;
    let length = req.query.length;
    let cursor = req.query.cursor;
    let parentUuid = req.query.parentUuid;
    let date;
    let random;
    let limit;

    if(cursor){
        let stringCursor = cursor.split('_');

        date = new Date().setTime(parseInt(stringCursor[0]));
        random = parseInt(stringCursor[1]);
    }
    else{
        date = new Date('2000-01-01T00:00Z');
        random = -1;
    }

    if(length){
        length = parseInt(length);
    }
    else{
        length = 50;
    }
    limit = length + 1;

    if(parentUuid){
        let parentComment = await serverConfig.model.Comment.findOne({
            attributes: ['id'],
            where: {
                uuid: parentUuid
            }
        });
        let childCommentList = await serverConfig.model.Comment.findAll({
            attributes: ['uuid', 'content', 'createdAt', 'updatedAt', 'random'],
            where: {
                parentId: parentComment.id,
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
            include: [{
                model: serverConfig.model.User,
                as: 'CommentWriter',
                attributes: ['uuid', 'nickname']
            }],
            order: [
                ['createdAt', 'ASC'],
                ['random', 'ASC']
            ],
            limit: limit
        });
        
        let resBody = {
            list: []
        };

        if(childCommentList.length === 0){
            res.json(resBody);
            res.end();
            return;
        }

        if(childCommentList[limit - 1]){
            let nextComment = childCommentList[limit - 1];
            let utcMs = nextComment.createdAt.getTime();
            let random = nextComment.random;

            resBody.nextCursor = `${utcMs}_${random}`;
        }

        let bound = Math.min(childCommentList.length, limit - 1);

        for(let i = 0; i < bound; i++){
            let comment = childCommentList[i];

            resBody.list.push({
                uuid: comment.uuid,
                writer: {
                    uuid: comment.CommentWriter.uuid,
                    nickname: comment.CommentWriter.nickname
                },
                content: comment.content,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString()
            });
        }
        res.set('Content-Type', 'application/json');
        res.write(JSON.stringify(resBody, null, 5));
        res.end();
    }
    else{
        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        let mediaValueObject = await mediaEntity.getMetadata();

        let parentCommentList = await serverConfig.model.Comment.findAll({
            attributes: ['uuid', 'content', 'createdAt', 'updatedAt', 'random'],
            where: {
                mediaId: mediaValueObject.id,
                parentId: {
                    [sequelize.Op.is]: null
                },
                [sequelize.Op.or]: [{
                    createdAt: {
                        [sequelize.Op.gt]: date
                    }
                }, {
                    [sequelize.Op.and]: [{
                        createdAt: date
                    }, {
                        random: {
                            [sequelize.Op.gte]: random
                        }
                    }]
                }]
            },
            include: [{
                model: serverConfig.model.User,
                as: 'CommentWriter',
                attributes: ['uuid', 'nickname']
            }],
            order: [
                ['createdAt', 'ASC'],
                ['random', 'ASC']
            ],
            limit: limit
        });
        
        let resBody = {
            list: []
        };

        if(parentCommentList[limit - 1]){
            let nextComment = parentCommentList[limit - 1];
            let utcMs = nextComment.createdAt.getTime();
            let random = nextComment.random;

            resBody.nextCursor = `${utcMs}_${random}`;
        }

        let bound = Math.min(parentCommentList.length, limit - 1);

        for(let i = 0; i < bound; i++){
            let comment = parentCommentList[i];

            resBody.list.push({
                commentUuid: comment.uuid,
                writer: {
                    userUuid: comment.CommentWriter.uuid,
                    nickname: comment.CommentWriter.nickname
                },
                content: comment.content,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString()
            });
        }
        res.set('Content-Type', 'application/json');
        res.write(JSON.stringify(resBody, null, 5));
        res.end();
    }
});

module.exports = {
    router: mediaRouter
};