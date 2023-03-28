const express = require('express');
const stream = require('stream/promises');

const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');
const commentRepository = require('./repository/commentRepository');
const mediaListRepository = require('./repository/mediaListRepository');
const checker = require('./checker');
const errorHandler = require('./errorHandler');
const serverConfig = require('./serverConfig');
const pagination = require('./pagination');
const tagManipulator = require('./tag');


const mediaRouter = express.Router();

mediaRouter.get('/', async function(req, res){
    try{
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let sort = checker.checkMediaSortOption(req.query.sort, 'sort');
        let tagList = checker.checkTagList(req.query.tag, 'tag');
        let mediaList = [];
        let paginator;

        if(sort === 'new'){
            let [date, random] = checker.checkDateRandomCursor(
                req.query.cursor, '_', pagination.endingDate, 'cursor'
            );
            paginator = new pagination.Paginator({
                length: length,
                mapper: pagination.mediaToSimpleFormat,
                cursorFactory: pagination.createDateRandomCursor
            }); 

            mediaList = await mediaListRepository.getDateDescendingMediaList(
                date, random, tagList, paginator.getRequiredLength()
            );
        }
        else if(sort === 'old'){
            let [date, random] = checker.checkDateRandomCursor(
                req.query.cursor, '_', pagination.beginningDate, 'cursor'
            );
            paginator = new pagination.Paginator({
                length: length,
                mapper: pagination.mediaToSimpleFormat,
                cursorFactory: pagination.createDateRandomCursor
            });

            mediaList = await mediaListRepository.getDateAscendingMediaList(
                date, random, tagList, paginator.getRequiredLength()
            );
        }
        else if(sort === 'most_watched'){
            let [viewCount, random] = checker.checkViewCountRandomCursor(
                req.query.cursor, '_', pagination.maximumViewCount, 'cursor'
            );
            paginator = new pagination.Paginator({
                length: length,
                mapper: pagination.mediaToSimpleFormat,
                cursorFactory: pagination.createViewCountRandomCursor
            });

            mediaList = await mediaListRepository.getViewCountDescendingMediaList(
                viewCount, random, tagList, paginator.getRequiredLength()
            );
        }

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
            tagList: tagManipulator.splitTagString(mediaValueObject.tagString),
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
            cursorFactory: pagination.createDateRandomCursor
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