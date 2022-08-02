const express = require('express');
const stream = require('stream/promises');
const sequelize = require('sequelize');

const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');
const commentRepository = require('./repository/commentRepository');
const mediaListRepository = require('./repository/mediaListRepository');
const checker = require('./checker');
const errorHandler = require('./errorhandler');
const serverConfig = require('./serverConfig');
const pagination = require('./pagination');


const mediaRouter = express.Router();

/**
 * sort: 'new' | 'old' | 'most_watched'
 */
mediaRouter.get('/', async function(req, res){
    try{
        let [date, random] = checker.checkDateRandomCursor(req.query.cursor, '_', pagination.endingDate, 'cursor');
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let paginator = new pagination.Paginator({
            length: length,
            mapper: function(media){
                return {
                    uuid: media.uuid,
                    title: media.title,
                    type: media.type,
                    updateTime: media.updateTime,
                    viewCount: media.viewCount,
                    dislikeCount: media.dislikeCount,
                    uploader: {
                        uuid: media.Uploader.uuid,
                        nickname: media.Uploader.nickname
                    }
                };
            },
            cursorLength: function(media){
                let utcMs = media.createdAt.getTime();
                let random = media.random;

                return `${utcMs}_${random}`;
            }
        });

        let mediaList = await mediaListRepository.getMediaList(date, random, paginator.getRequiredLength());
        let resBody = paginator.buildResponseBody(mediaList);

        res.json(resBody);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.get('/:mediaUuid/info', async function(req, res){
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        
        await mediaEntity.addViewCount(1);

        let mediaValueObject = await mediaEntity.getMetadataWithUploader();
        let viewCount = await mediaEntity.getViewCount();
        let dislikeCount = await mediaEntity.getDislikeCount();
        
        res.json({
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
        });
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
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
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
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let [date, random] = checker.checkDateRandomCursor(req.query.cursor, '_', pagination.beginningDate, 'cursor');
        let parentUuid = req.query.parentUuid;

        let commentList;

        let paginator = new pagination.Paginator({
            length: length,
            mapper: function(comment){
                return {
                    uuid: comment.uuid,
                    writer: {
                        uuid: comment.CommentWriter.uuid,
                        nickname: comment.CommentWriter.nickname
                    },
                    content: comment.content,
                    createdAt: comment.createdAt.toISOString(),
                    updatedAt: comment.updatedAt.toISOString()
                };
            },
            cursorFactory: function(comment){
                let utcMs = comment.createdAt.getTime();
                let random = comment.random;

                return `${utcMs}_${random}`;
            }
        });
        let requiredLength = paginator.getRequiredLength();

        if(parentUuid){
            checker.checkUuid(parentUuid, 'parent uuid');

            let parentComment = await commentRepository.getCommentByUuid(parentUuid);

            commentList = await commentRepository.getChildCommentList(
                date, random, requiredLength, parentComment.id
            );
        }
        else{
            let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
            let mediaValueObject = await mediaEntity.getMetadata();

            commentList = await commentRepository.getCommentListOfMedia(
                date, random, requiredLength, mediaValueObject.id
            );
        }

        let resBody = paginator.buildResponseBody(commentList);
        
        res.json(resBody);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.post('/:mediaUuid/comments', async function(req, res){
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
        let content = checker.checkPlaintext(req.body.content, 'comment content');
        let writerUuid = checker.checkUuid(req.body.writerUuid, 'writer uuid');
        let parentUuid = req.body.parentUuid;

        let authorizer = await checker.checkAuthorizationHeader(req);

        checker.checkUserAuthorization(authorizer, writerUuid);

        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        let mediaValueObjectPromise = mediaEntity.getMetadata();

        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(writerUuid);
        let mediaValueObject = await mediaValueObjectPromise;
        
        let commentSeed = {
            writerId: userValueObject.id,
            mediaId: mediaValueObject.id,
            content: content,
            random: Math.floor(pagination.maximumRandom * Math.random())
        };

        if(parentUuid){
            checker.checkUuid(parentUuid);

            let parentComment = await serverConfig.model.Comment.findOne({
                where: {
                    uuid: parentUuid
                }
            });

            commentSeed.parentId = parentComment.id;
        }

        let comment = await serverConfig.model.Comment.create(commentSeed);

        res.set('Location', comment.uuid);
        res.status(201);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

module.exports = {
    router: mediaRouter
};